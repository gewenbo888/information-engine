"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLang, T, t, type Bi } from "./lang";

/* ─────────────────────────────────────────────────────────────────────
   INTERNET & NETWORK CIVILIZATION
   A planetary node graph with animated packets + a communication-evolution
   timeline that re-tunes the network intensity. Pure React + Canvas 2D.
   ───────────────────────────────────────────────────────────────────── */

type Node = { id: number; x: number; y: number; r: number; pulse: number };
type Edge = { a: number; b: number };
type Packet = { edge: number; t: number; speed: number; dir: 1 | -1 };

// Hand-placed coordinates (0..1 space) sketching continents on a planet map.
const NODES_RAW: [number, number][] = [
  [0.14, 0.34], [0.22, 0.5], [0.18, 0.66], // Americas (W)
  [0.3, 0.42], [0.27, 0.6],                 // Americas (E)
  [0.46, 0.3], [0.5, 0.46], [0.52, 0.62],  // Europe / Africa
  [0.43, 0.74], [0.58, 0.36],              // S.Africa / E.Europe
  [0.68, 0.3], [0.72, 0.48], [0.65, 0.58], // Asia
  [0.8, 0.4], [0.84, 0.56],                // E.Asia
  [0.78, 0.7], [0.88, 0.72],               // Oceania
  [0.36, 0.2], [0.6, 0.74],                // poles-ish anchors
];

// Edges chosen to read like trans-oceanic / continental backbones.
const EDGES_RAW: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 2], [3, 5], [5, 9], [5, 6],
  [6, 7], [7, 8], [9, 10], [10, 11], [11, 12], [11, 13], [13, 14],
  [14, 15], [15, 16], [12, 8], [6, 9], [10, 6], [17, 5], [17, 0],
  [8, 18], [18, 16], [12, 14], [4, 6], [13, 10], [7, 11],
];

type Era = {
  key: string;
  year: string;
  name: Bi;
  reach: Bi;
  latency: Bi;
  bandwidth: Bi;
  // log10 of bits/sec — drives bar scale + animation intensity
  logBw: number;
  intensity: number; // packet density multiplier
};

const ERAS: Era[] = [
  {
    key: "telegraph", year: "1844",
    name: { en: "Telegraph", zh: "电报" },
    reach: { en: "Continental wires", zh: "横贯大陆的电线" },
    latency: { en: "minutes", zh: "数分钟" },
    bandwidth: { en: "~10 bits/s · a few words per minute", zh: "约 10 比特/秒 · 每分钟几个词" },
    logBw: 1, intensity: 0.35,
  },
  {
    key: "telephone", year: "1876",
    name: { en: "Telephone", zh: "电话" },
    reach: { en: "Point-to-point voice", zh: "点对点语音" },
    latency: { en: "seconds", zh: "数秒" },
    bandwidth: { en: "~3 kbit/s · live human voice", zh: "约 3 千比特/秒 · 实时人声" },
    logBw: 3.5, intensity: 0.5,
  },
  {
    key: "radio", year: "1900s",
    name: { en: "Radio", zh: "无线电" },
    reach: { en: "One-to-many, over the horizon", zh: "一对多，跨越地平线" },
    latency: { en: "near-instant", zh: "近乎即时" },
    bandwidth: { en: "~15 kbit/s broadcast", zh: "约 15 千比特/秒 广播" },
    logBw: 4.2, intensity: 0.6,
  },
  {
    key: "tv", year: "1930s",
    name: { en: "Television", zh: "电视" },
    reach: { en: "Mass broadcast, moving image", zh: "大众广播，活动影像" },
    latency: { en: "near-instant", zh: "近乎即时" },
    bandwidth: { en: "~5 Mbit/s · sight + sound", zh: "约 5 兆比特/秒 · 图像与声音" },
    logBw: 6.7, intensity: 0.7,
  },
  {
    key: "arpanet", year: "1969",
    name: { en: "ARPANET / Internet", zh: "阿帕网 / 互联网" },
    reach: { en: "Packet-switched machines", zh: "分组交换的机器" },
    latency: { en: "hundreds of ms", zh: "数百毫秒" },
    bandwidth: { en: "~56 kbit/s → growing fast", zh: "约 56 千比特/秒 → 快速增长" },
    logBw: 4.7, intensity: 0.65,
  },
  {
    key: "web", year: "1991",
    name: { en: "World Wide Web", zh: "万维网" },
    reach: { en: "Documents linked globally", zh: "全球互链的文档" },
    latency: { en: "~100 ms", zh: "约 100 毫秒" },
    bandwidth: { en: "~10 Mbit/s broadband", zh: "约 10 兆比特/秒 宽带" },
    logBw: 7, intensity: 0.8,
  },
  {
    key: "mobile", year: "2000s",
    name: { en: "Mobile 3G / 4G", zh: "移动 3G / 4G" },
    reach: { en: "The network in every pocket", zh: "口袋里的网络" },
    latency: { en: "30–50 ms", zh: "30–50 毫秒" },
    bandwidth: { en: "~100 Mbit/s per device", zh: "每设备约 100 兆比特/秒" },
    logBw: 8, intensity: 0.9,
  },
  {
    key: "social", year: "2010s",
    name: { en: "Smartphones · Social", zh: "智能手机 · 社交媒体" },
    reach: { en: "Billions, always-on", zh: "数十亿，永远在线" },
    latency: { en: "~20 ms", zh: "约 20 毫秒" },
    bandwidth: { en: "Petabytes shared daily", zh: "每日共享数 PB" },
    logBw: 9, intensity: 1.05,
  },
  {
    key: "5g", year: "2020s",
    name: { en: "5G · AI Networks", zh: "5G · AI 网络" },
    reach: { en: "Planet-scale, machine + human", zh: "行星尺度，机器与人类" },
    latency: { en: "~1–5 ms", zh: "约 1–5 毫秒" },
    bandwidth: { en: "Fiber backbone ~Tbit/s", zh: "光纤骨干约 太比特/秒" },
    logBw: 12, intensity: 1.4,
  },
];

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export default function InfoNetwork() {
  const { lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const [active, setActive] = useState(5); // default: World Wide Web
  const activeRef = useRef(active);
  activeRef.current = active;

  const edges = useMemo<Edge[]>(() => EDGES_RAW.map(([a, b]) => ({ a, b })), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    // node state lives here so pulses persist across frames
    const nodes: Node[] = NODES_RAW.map(([x, y], id) => ({ id, x, y, r: 0, pulse: 0 }));
    let packets: Packet[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = Math.max(280, Math.min(rect.width * 0.56, 460));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const px = (n: Node) => 24 + n.x * (W - 48);
    const py = (n: Node) => 18 + n.y * (H - 36);

    const spawn = () => {
      const intensity = ERAS[activeRef.current].intensity;
      const target = Math.round(10 + intensity * 26);
      while (packets.length < target) {
        const edge = (Math.random() * edges.length) | 0;
        packets.push({
          edge,
          t: 0,
          speed: (0.006 + Math.random() * 0.01) * (0.6 + intensity),
          dir: Math.random() > 0.5 ? 1 : -1,
        });
      }
      if (packets.length > target) packets = packets.slice(0, target);
    };

    let last = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      frame++;
      if (frame % 30 === 0) spawn();

      ctx.clearRect(0, 0, W, H);

      // faint planet halo
      const cx = 24 + 0.5 * (W - 48);
      const cy = 18 + 0.5 * (H - 36);
      const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.55);
      halo.addColorStop(0, "rgba(47,198,245,0.05)");
      halo.addColorStop(1, "rgba(4,7,13,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // edges (electric-cyan wires)
      ctx.lineWidth = 1;
      for (const e of edges) {
        const A = nodes[e.a], B = nodes[e.b];
        ctx.strokeStyle = "rgba(47,198,245,0.16)";
        ctx.beginPath();
        ctx.moveTo(px(A), py(A));
        ctx.lineTo(px(B), py(B));
        ctx.stroke();
      }

      // packets
      for (const p of packets) {
        const e = edges[p.edge];
        const A = nodes[e.a], B = nodes[e.b];
        p.t += p.speed * (dt / 16.7);
        if (p.t >= 1) {
          // arrival: pulse the destination node, recycle packet
          const dest = p.dir === 1 ? B : A;
          dest.pulse = 1;
          p.t = 0;
          p.edge = (Math.random() * edges.length) | 0;
          p.dir = Math.random() > 0.5 ? 1 : -1;
          continue;
        }
        const tt = p.dir === 1 ? ease(p.t) : ease(1 - p.t);
        const x = px(A) + (px(B) - px(A)) * tt;
        const y = py(A) + (py(B) - py(A)) * tt;
        // glowing packet dot
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, "rgba(166,233,253,0.95)");
        g.addColorStop(0.4, "rgba(47,198,245,0.6)");
        g.addColorStop(1, "rgba(47,198,245,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(230,255,250,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // nodes (signal-green) with pulse rings
      for (const n of nodes) {
        const x = px(n), y = py(n);
        n.pulse = Math.max(0, n.pulse - dt / 700);
        const baseR = 3.4;
        if (n.pulse > 0) {
          ctx.strokeStyle = `rgba(35,230,179,${0.5 * n.pulse})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(x, y, baseR + (1 - n.pulse) * 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 12 + n.pulse * 8);
        glow.addColorStop(0, `rgba(35,230,179,${0.55 + n.pulse * 0.4})`);
        glow.addColorStop(1, "rgba(35,230,179,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 12 + n.pulse * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9af9e1";
        ctx.beginPath();
        ctx.arc(x, y, baseR + n.pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    spawn();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [edges]);

  const era = ERAS[active];
  // bar scale across the era set, log-normalized
  const minLog = 1, maxLog = 12;
  const barPct = (l: number) => ((l - minLog) / (maxLog - minLog)) * 100;

  return (
    <div className="w-full">
      {/* network canvas */}
      <div className="holo relative overflow-hidden rounded-xl p-3 sm:p-4">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
        <div className="relative mb-2 flex items-center justify-between">
          <span className="label-mono">
            {t({ en: "PLANETARY PACKET FLOW", zh: "行星级分组流" }, lang)}
          </span>
          <span className="label-mono wire-text">
            {t({ en: "LIVE", zh: "实时" }, lang)} · {era.year}
          </span>
        </div>
        <div ref={wrapRef} className="relative w-full">
          <canvas ref={canvasRef} className="block w-full" />
        </div>
      </div>

      {/* timeline strip */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-3">
          <span className="label-mono">
            {t({ en: "COMMUNICATION EVOLUTION", zh: "通信演化" }, lang)}
          </span>
          <div className="h-px flex-1 rule-sig" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {ERAS.map((e, i) => {
            const on = i === active;
            return (
              <button
                key={e.key}
                onClick={() => setActive(i)}
                className={`group relative flex min-w-[88px] flex-1 flex-col items-start rounded-lg border px-2.5 py-2 text-left transition ${
                  on
                    ? "border-signal-500/60 bg-signal-500/10 shadow-glow"
                    : "border-void-600 bg-void-800/50 hover:border-wire-500/40"
                }`}
              >
                <span className={`mono text-[0.62rem] ${on ? "signal-text" : "text-ghost-500"}`}>
                  {e.year}
                </span>
                <span
                  className={`mt-0.5 text-[0.72rem] leading-tight ${on ? "text-ghost-50" : "text-ghost-300"} ${
                    lang === "zh" ? "zh" : ""
                  }`}
                >
                  {e.name[lang]}
                </span>
                <span
                  className={`mt-1 h-0.5 w-full rounded-full ${
                    on ? "bg-signal-500" : "bg-void-500 group-hover:bg-wire-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* readout */}
      <div key={era.key} className="rise-in mt-3 grid gap-3 sm:grid-cols-3">
        <ReadCell
          label={{ en: "REACH", zh: "覆盖范围" }}
          value={era.reach}
          tone="signal"
        />
        <ReadCell
          label={{ en: "LATENCY", zh: "时延" }}
          value={era.latency}
          tone="wire"
        />
        <ReadCell
          label={{ en: "BANDWIDTH", zh: "带宽" }}
          value={era.bandwidth}
          tone="flux"
        />
      </div>

      {/* log-scale bandwidth bar */}
      <div className="holo mt-3 rounded-lg p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label-mono">
            {t({ en: "BANDWIDTH · LOG SCALE", zh: "带宽 · 对数刻度" }, lang)}
          </span>
          <span className="mono flux-text text-[0.7rem]">
            10<sup>{era.logBw}</sup> {t({ en: "bit/s", zh: "比特/秒" }, lang)}
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-void-800">
          <div className="absolute inset-0 dot-bg opacity-40" />
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-signal-600 via-wire-500 to-flux-400 transition-[width] duration-500 ease-out"
            style={{ width: `${barPct(era.logBw)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[0.58rem] text-ghost-500 mono">
          <span>10¹</span>
          <span>10⁶</span>
          <span>10¹²</span>
        </div>
      </div>

      {/* caption */}
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ghost-300">
        <T
          v={{
            en: "Each layer collapsed distance and raised bandwidth — telegraph to fiber spans eleven orders of magnitude — knitting humanity into a single, low-latency, planet-spanning nervous system.",
            zh: "每一层都压缩了距离、抬高了带宽——从电报到光纤跨越十一个数量级——将人类编织成一个低时延、覆盖整个行星的统一神经系统。",
          }}
        />
      </p>
    </div>
  );
}

function ReadCell({ label, value, tone }: { label: Bi; value: Bi; tone: "signal" | "wire" | "flux" }) {
  const { lang } = useLang();
  const toneCls =
    tone === "signal" ? "signal-text" : tone === "wire" ? "wire-text" : "flux-text";
  return (
    <div className="holo rounded-lg p-3">
      <div className={`label-mono ${toneCls}`}>{label[lang]}</div>
      <div className={`mt-1 text-sm text-ghost-100 ${lang === "zh" ? "zh" : ""}`}>{value[lang]}</div>
    </div>
  );
}
