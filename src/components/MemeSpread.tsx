"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang, T, type Bi } from "./lang";

/* ---------- deterministic PRNG (mulberry32) so the graph layout is stable ---------- */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- variant palette: the original idea + 3 mutated strains ---------- */
type Variant = 0 | 1 | 2 | 3;
const VARIANTS: { name: Bi; hex: string; soft: string }[] = [
  { name: { en: "Origin idea", zh: "原始观念" }, hex: "#23e6b3", soft: "rgba(35,230,179,0.9)" }, // signal
  { name: { en: "Variant β", zh: "变体 β" }, hex: "#ff4da6", soft: "rgba(255,77,166,0.9)" }, // pulse
  { name: { en: "Variant γ", zh: "变体 γ" }, hex: "#f5b338", soft: "rgba(245,179,56,0.9)" }, // flux
  { name: { en: "Variant δ", zh: "变体 δ" }, hex: "#2fc6f5", soft: "rgba(47,198,245,0.9)" }, // wire
];

/* node state: S susceptible · I carrier(infected) · R recovered/immune */
type State = "S" | "I" | "R";
interface Node {
  id: number;
  x: number;
  y: number;
  state: State;
  variant: Variant; // meaningful only when I or R
  // visual: glow strength 0..1 (eases up on infection, down on recovery)
  glow: number;
}
interface Edge {
  a: number;
  b: number;
}

const N_NODES = 58;
const VW = 1000; // virtual canvas width (we scale to clientWidth)
const VH = 560;

/* Build a plausible spatial graph: scatter nodes, connect near neighbours (k-nearest-ish). */
function buildGraph(seed: number): { nodes: Node[]; edges: Edge[] } {
  const r = rng(seed);
  const nodes: Node[] = [];
  for (let i = 0; i < N_NODES; i++) {
    // cluster into ~4 loose communities for a social feel
    const cluster = i % 4;
    const cx = [0.26, 0.74, 0.32, 0.7][cluster] * VW;
    const cy = [0.3, 0.28, 0.74, 0.72][cluster] * VH;
    const ang = r() * Math.PI * 2;
    const rad = (0.06 + r() * 0.2) * Math.min(VW, VH);
    nodes.push({
      id: i,
      x: Math.max(28, Math.min(VW - 28, cx + Math.cos(ang) * rad + (r() - 0.5) * 80)),
      y: Math.max(28, Math.min(VH - 28, cy + Math.sin(ang) * rad + (r() - 0.5) * 80)),
      state: "S",
      variant: 0,
      glow: 0,
    });
  }
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < N_NODES; i++) {
    const dists = nodes
      .map((nd, j) => ({ j, d: (nd.x - nodes[i].x) ** 2 + (nd.y - nodes[i].y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d);
    const k = 2 + Math.floor(r() * 2); // 2-3 nearest
    for (let m = 0; m < k; m++) {
      const j = dists[m].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ a: Math.min(i, j), b: Math.max(i, j) });
      }
    }
  }
  // a few long-range "weak ties" bridging communities (Granovetter)
  for (let m = 0; m < 6; m++) {
    const a = Math.floor(r() * N_NODES);
    const b = Math.floor(r() * N_NODES);
    if (a !== b) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ a: Math.min(a, b), b: Math.max(a, b) });
      }
    }
  }
  return { nodes, edges };
}

export default function MemeSpread() {
  const { lang } = useLang();
  const [r0, setR0] = useState(0.42); // transmissibility per contact per tick
  const [mutate, setMutate] = useState(true);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [seed, setSeed] = useState(7);
  // live counts per variant (carriers currently infected) for the curve
  const [history, setHistory] = useState<number[][]>([]);
  const [counts, setCounts] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef(buildGraph(seed));
  const adjRef = useRef<number[][]>([]);
  const r0Ref = useRef(r0);
  const mutateRef = useRef(mutate);
  const runRef = useRef(running);
  r0Ref.current = r0;
  mutateRef.current = mutate;
  runRef.current = running;

  /* build adjacency list whenever the graph (seed) changes */
  const rebuildAdj = useCallback(() => {
    const { nodes, edges } = graphRef.current;
    const adj: number[][] = nodes.map(() => []);
    for (const e of edges) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
    adjRef.current = adj;
  }, []);

  /* seed a fresh idea at a well-connected node */
  const seedIdea = useCallback(() => {
    const { nodes } = graphRef.current;
    for (const n of nodes) {
      n.state = "S";
      n.variant = 0;
      n.glow = 0;
    }
    // pick the highest-degree node as patient zero
    let best = 0;
    let bestDeg = -1;
    adjRef.current.forEach((a, i) => {
      if (a.length > bestDeg) {
        bestDeg = a.length;
        best = i;
      }
    });
    nodes[best].state = "I";
    nodes[best].variant = 0;
    nodes[best].glow = 0.2;
    setTick(0);
    setHistory([]);
    setCounts([1, 0, 0, 0]);
  }, []);

  // initialise once + whenever seed changes
  useEffect(() => {
    graphRef.current = buildGraph(seed);
    rebuildAdj();
    seedIdea();
  }, [seed, rebuildAdj, seedIdea]);

  /* ---------- simulation tick (SIR-like) on a fixed interval ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!runRef.current) return;
      const { nodes } = graphRef.current;
      const adj = adjRef.current;
      const beta = r0Ref.current;
      const gamma = 0.12; // recovery probability per tick

      const newlyInfected: { id: number; variant: Variant }[] = [];
      const newlyRecovered: number[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        if (nd.state === "I") {
          // try to infect susceptible neighbours
          for (const j of adj[i]) {
            if (nodes[j].state === "S" && Math.random() < beta) {
              // mutation: the transmitted copy occasionally drifts to a new variant
              let v = nd.variant;
              if (mutateRef.current && Math.random() < 0.08) {
                v = (Math.floor(Math.random() * 4) as Variant);
              }
              newlyInfected.push({ id: j, variant: v });
            }
          }
          // recover / lose interest
          if (Math.random() < gamma) newlyRecovered.push(i);
        }
      }

      for (const { id, variant } of newlyInfected) {
        if (nodes[id].state === "S") {
          nodes[id].state = "I";
          nodes[id].variant = variant;
        }
      }
      for (const id of newlyRecovered) {
        nodes[id].state = "R";
      }

      // tally carriers per variant
      const c: [number, number, number, number] = [0, 0, 0, 0];
      for (const nd of nodes) if (nd.state === "I") c[nd.variant]++;
      setCounts(c);
      setHistory((h) => [...h.slice(-119), c]);
      setTick((t) => t + 1);
    }, 420);
    return () => clearInterval(interval);
  }, []);

  /* ---------- canvas render loop (eases glow + draws graph) ---------- */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    function resize() {
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = (w * VH) / VW;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx!.setTransform((dpr * w) / VW, 0, 0, (dpr * h) / VH, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function frame() {
      const { nodes, edges } = graphRef.current;
      ctx!.clearRect(0, 0, VW, VH);

      // edges
      for (const e of edges) {
        const A = nodes[e.a];
        const B = nodes[e.b];
        const live = (A.state === "I" || B.state === "I");
        ctx!.beginPath();
        ctx!.moveTo(A.x, A.y);
        ctx!.lineTo(B.x, B.y);
        if (live) {
          const v = A.state === "I" ? A.variant : B.variant;
          ctx!.strokeStyle = VARIANTS[v].hex + "55";
          ctx!.lineWidth = 1.2;
        } else {
          ctx!.strokeStyle = "rgba(92,242,204,0.07)";
          ctx!.lineWidth = 0.8;
        }
        ctx!.stroke();
      }

      // nodes
      for (const nd of nodes) {
        // ease glow toward target
        const target = nd.state === "I" ? 1 : nd.state === "R" ? 0.15 : 0;
        nd.glow += (target - nd.glow) * 0.12;

        const baseR = 4.6;
        if (nd.state === "I" && nd.glow > 0.02) {
          const g = ctx!.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 26 * nd.glow);
          g.addColorStop(0, VARIANTS[nd.variant].hex + "aa");
          g.addColorStop(1, VARIANTS[nd.variant].hex + "00");
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(nd.x, nd.y, 26 * nd.glow, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(nd.x, nd.y, baseR, 0, Math.PI * 2);
        if (nd.state === "S") {
          ctx!.fillStyle = "rgba(144,163,158,0.45)"; // dim ghost
        } else if (nd.state === "I") {
          ctx!.fillStyle = VARIANTS[nd.variant].hex;
        } else {
          // recovered/immune — faded tint of the variant it carried
          ctx!.fillStyle = VARIANTS[nd.variant].hex + "3a";
        }
        ctx!.fill();
        if (nd.state === "I") {
          ctx!.strokeStyle = "#eafff8";
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
        }
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const { nodes } = graphRef.current;
  const totalI = counts.reduce((a, b) => a + b, 0);
  const totalR = nodes.filter((n) => n.state === "R").length;
  const totalS = nodes.filter((n) => n.state === "S").length;
  const peak = Math.max(1, ...history.map((c) => c.reduce((a, b) => a + b, 0)));

  return (
    <div className="w-full">
      {/* network canvas */}
      <div className="holo rounded-xl p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="label-mono">
            {lang === "zh" ? "模因传染 · 社会网络" : "Memetic Contagion · Social Graph"}
          </span>
          <span className="mono text-[0.7rem] text-ghost-500">
            t = <span className="text-signal-300">{tick}</span>
          </span>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-signal-500/10 bg-void-950/70 dot-bg">
          <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
          {/* legend overlay */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-md bg-void-950/60 px-2 py-1.5 backdrop-blur-sm">
            {VARIANTS.map((v, i) =>
              i === 0 || mutate ? (
                <div key={i} className="flex items-center gap-1.5 font-mono text-[0.58rem] text-ghost-300">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: v.hex, boxShadow: `0 0 6px ${v.hex}` }} />
                  <T v={v.name} />
                  <span className="text-ghost-500">· {counts[i]}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
        <p className="mt-2 font-mono text-[0.66rem] text-ghost-500">
          {lang === "zh"
            ? "// 暗灰=易感 · 发光=携带者 · 淡色=已免疫/淡忘"
            : "// dim = susceptible · glowing = carrier · faded = immune / forgotten"}
        </p>
      </div>

      {/* controls */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* transmissibility */}
        <div className="holo rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="label-mono">{lang === "zh" ? "传播力 R₀" : "Transmissibility R₀"}</span>
            <span className="mono text-sm text-signal-300">{r0.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.01}
            value={r0}
            onChange={(e) => setR0(parseFloat(e.target.value))}
            className="mt-3 w-full accent-signal-500"
            aria-label="transmissibility"
          />
          <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ghost-500">
            <span>{lang === "zh" ? "低" : "weak"}</span>
            <span>{lang === "zh" ? "病毒式" : "viral"}</span>
          </div>
        </div>

        {/* mutation toggle */}
        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "变异" : "Mutation"}</span>
          <button
            onClick={() => setMutate((m) => !m)}
            className={`mt-3 w-full rounded-lg border px-3 py-2 font-mono text-sm transition ${
              mutate
                ? "border-pulse-500/50 bg-pulse-500/15 text-pulse-300"
                : "border-ghost-700 text-ghost-300 hover:border-signal-500/30"
            }`}
          >
            {mutate ? (lang === "zh" ? "变异：开 — 变体竞争" : "Mutation: ON — variants compete") : lang === "zh" ? "变异：关" : "Mutation: OFF"}
          </button>
          <p className="mt-2 font-mono text-[0.6rem] text-ghost-500">
            {lang === "zh" ? "复制时观念偶尔漂变成新变体" : "copies occasionally drift into new strains"}
          </p>
        </div>

        {/* run / seed / reset */}
        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "控制" : "Controls"}</span>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-lg border border-signal-500/30 px-2 py-2 font-mono text-[0.7rem] text-signal-300 transition hover:bg-signal-500/15"
            >
              {running ? (lang === "zh" ? "暂停" : "Pause") : lang === "zh" ? "运行" : "Run"}
            </button>
            <button
              onClick={seedIdea}
              className="rounded-lg border border-flux-500/30 px-2 py-2 font-mono text-[0.7rem] text-flux-400 transition hover:bg-flux-500/15"
            >
              {lang === "zh" ? "新观念" : "Seed"}
            </button>
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="rounded-lg border border-wire-500/30 px-2 py-2 font-mono text-[0.7rem] text-wire-400 transition hover:bg-wire-500/15"
            >
              {lang === "zh" ? "重置" : "Reset"}
            </button>
          </div>
          <p className="mt-2 font-mono text-[0.6rem] text-ghost-500">
            {lang === "zh" ? '“重置”重建网络拓扑' : '"Reset" rebuilds the network'}
          </p>
        </div>
      </div>

      {/* counts */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label={{ en: "Susceptible", zh: "易感" }} value={`${totalS}`} accent="ghost" />
        <Stat label={{ en: "Carriers", zh: "携带者" }} value={`${totalI}`} accent="signal" />
        <Stat label={{ en: "Immune / fading", zh: "免疫 / 淡忘" }} value={`${totalR}`} accent="pulse" />
      </div>

      {/* live competition curve */}
      <div className="mt-4 holo rounded-xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="label-mono">{lang === "zh" ? "变体随时间的竞争" : "Variant share over time"}</span>
          <span className="mono text-[0.6rem] text-ghost-500">{lang === "zh" ? "携带者计数" : "carrier count"}</span>
        </div>
        <svg viewBox="0 0 480 120" className="block w-full" style={{ height: 120 }} preserveAspectRatio="none">
          <line x1="0" y1="119" x2="480" y2="119" stroke="rgba(92,242,204,0.18)" strokeWidth="1" />
          {([0, 1, 2, 3] as Variant[]).map((v) => {
            if (v !== 0 && !mutate && counts[v] === 0 && !history.some((c) => c[v] > 0)) return null;
            const pts = history
              .map((c, i) => {
                const x = history.length > 1 ? (i / (history.length - 1)) * 480 : 0;
                const y = 119 - (c[v] / peak) * 110;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            if (history.length < 2) return null;
            return (
              <polyline
                key={v}
                points={pts}
                fill="none"
                stroke={VARIANTS[v].hex}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${VARIANTS[v].hex})` }}
              />
            );
          })}
          {history.length < 2 && (
            <text x="240" y="64" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="rgba(144,163,158,0.6)">
              {lang === "zh" ? "运行以记录…" : "running to record…"}
            </text>
          )}
        </svg>
      </div>

      {/* caption */}
      <div className="mt-5 rounded-lg border border-signal-500/15 bg-void-900/50 p-4">
        <div className="display mb-1 text-sm signal-text">
          <T v={{ en: "Ideas are replicators", zh: "观念是复制因子" }} />
        </div>
        <p className="text-[0.82rem] leading-relaxed text-ghost-200">
          <T
            v={{
              en: "Dawkins called them memes: units of culture that copy from mind to mind. Myths, melodies, scientific theories, slogans and internet memes spread along social ties, mutate as they are retold, and compete for the scarce resource of human attention. What survives is not the truest idea but the most transmissible — culture is information under selection.",
              zh: "道金斯称之为模因：在头脑之间复制的文化单元。神话、旋律、科学理论、口号与网络梗沿着社会关系传播，在转述中变异，并争夺稀缺的人类注意力。存留下来的不一定是最真的观念，而是最易传播的——文化即选择之下的信息。",
            }}
          />
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: Bi; value: string; accent: "signal" | "flux" | "pulse" | "wire" | "ghost" }) {
  const txt = {
    signal: "text-signal-300",
    flux: "text-flux-400",
    pulse: "text-pulse-400",
    wire: "text-wire-400",
    ghost: "text-ghost-200",
  }[accent];
  return (
    <div className="holo rounded-xl p-3 text-center">
      <div className="label-mono">
        <T v={label} />
      </div>
      <div className={`mono mt-1 text-2xl ${txt}`}>{value}</div>
    </div>
  );
}
