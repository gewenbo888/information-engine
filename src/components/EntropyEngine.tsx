"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLang, T, type Bi } from "./lang";

/* Symbol palettes per alphabet size. Real glyphs, mono-rendered. */
const ALPHABETS: Record<number, string[]> = {
  2: ["0", "1"],
  4: ["0", "1", "2", "3"],
  8: ["A", "B", "C", "D", "E", "F", "G", "H"],
};

/* Per-symbol hue cycling between signal-green (order) and pulse-magenta (noise). */
const SYM_COLORS = ["#5cf2cc", "#67d8fb", "#ffc861", "#ff79bf", "#9af9e1", "#a6e9fd", "#ffdc9a", "#ffaad6"];

/**
 * Build a probability distribution over N symbols, biased by `pred` (predictability 0..1).
 * pred=0 → uniform (max entropy). pred=1 → almost all mass on symbol 0 (near-zero entropy).
 */
function buildDist(n: number, pred: number): number[] {
  const peak = 1 - Math.pow(1 - pred, 1.6); // share of mass given to the dominant symbol
  const dominant = peak;
  const rest = (1 - dominant) / (n - 1);
  const d = new Array(n).fill(rest);
  d[0] = dominant;
  // renormalise defensively
  const s = d.reduce((a, b) => a + b, 0);
  return d.map((x) => x / s);
}

function shannonH(dist: number[]): number {
  let h = 0;
  for (const p of dist) if (p > 0) h -= p * Math.log2(p);
  return h;
}

/* sample an index from a distribution */
function sample(dist: number[]): number {
  let r = Math.random();
  for (let i = 0; i < dist.length; i++) {
    r -= dist[i];
    if (r <= 0) return i;
  }
  return dist.length - 1;
}

const CONCEPTS: { k: Bi; v: Bi; cls: string }[] = [
  {
    k: { en: "Signal", zh: "信号" },
    v: { en: "The structured part — what a receiver can predict.", zh: "结构化的部分——接收者可预测的内容。" },
    cls: "text-signal-400 border-signal-500/30",
  },
  {
    k: { en: "Noise", zh: "噪声" },
    v: { en: "The unpredictable part — pure randomness, no pattern.", zh: "不可预测的部分——纯随机，无规律。" },
    cls: "text-pulse-400 border-pulse-500/30",
  },
  {
    k: { en: "Entropy", zh: "熵" },
    v: { en: "Average surprise per symbol, in bits. Measures uncertainty.", zh: "每符号的平均惊异度（比特）。衡量不确定性。" },
    cls: "text-flux-400 border-flux-500/30",
  },
  {
    k: { en: "Pattern", zh: "模式" },
    v: { en: "Repetition lowers entropy — and lets us compress.", zh: "重复降低熵——并使我们能够压缩。" },
    cls: "text-wire-400 border-wire-500/30",
  },
  {
    k: { en: "Meaning", zh: "意义" },
    v: { en: "Not measured by Shannon. Entropy is surprise, not sense.", zh: "香农并不衡量它。熵是惊异，而非含义。" },
    cls: "text-ghost-200 border-ghost-500/30",
  },
];

export default function EntropyEngine() {
  const { lang } = useLang();
  const [pred, setPred] = useState(0.32);
  const [n, setN] = useState(4);
  const [running, setRunning] = useState(true);

  const dist = useMemo(() => buildDist(n, pred), [n, pred]);
  const H = useMemo(() => shannonH(dist), [dist]);
  const maxH = Math.log2(n);
  const redundancy = maxH > 0 ? (1 - H / maxH) * 100 : 0;

  // Illustrative compression: a 4096-symbol message. Raw = ceil(log2 N) bits/sym fixed-width.
  const MSG = 4096;
  const rawBits = Math.ceil(maxH) * MSG;
  const compBits = Math.max(1, Math.round(H * MSG)); // entropy is the theoretical limit (Shannon source coding)
  const ratio = rawBits > 0 ? compBits / rawBits : 1;

  /* ---- streaming canvas ---- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<{ sym: number; x: number }[]>([]);
  const distRef = useRef(dist);
  const runRef = useRef(running);
  distRef.current = dist;
  runRef.current = running;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let spawnAcc = 0;
    const CELL = 30;
    const SPEED = 56; // px/s leftward

    function resize() {
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = 84;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = cv!.clientWidth;
      const h = 84;
      ctx!.clearRect(0, 0, w, h);

      if (runRef.current) {
        // advance
        for (const s of streamRef.current) s.x -= SPEED * dt;
        // cull
        streamRef.current = streamRef.current.filter((s) => s.x > -CELL);
        // spawn from the right edge to keep the row full
        spawnAcc += SPEED * dt;
        while (spawnAcc >= CELL) {
          spawnAcc -= CELL;
          const rightmost = streamRef.current.length
            ? Math.max(...streamRef.current.map((s) => s.x))
            : w - CELL;
          streamRef.current.push({ sym: sample(distRef.current), x: Math.max(rightmost + CELL, w) });
        }
        // initial fill
        if (streamRef.current.length === 0) {
          for (let x = 0; x < w + CELL; x += CELL) {
            streamRef.current.push({ sym: sample(distRef.current), x });
          }
        }
      }

      // draw cells
      ctx!.font = '600 18px "IBM Plex Mono", monospace';
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "center";
      const syms = ALPHABETS[distRef.current.length === n ? n : n] || ALPHABETS[2];
      for (const s of streamRef.current) {
        const cx = s.x + CELL / 2;
        const fade = Math.min(1, Math.min(s.x + CELL, w - s.x) / 40);
        const isDominant = s.sym === 0;
        ctx!.globalAlpha = 0.18 * Math.max(0.15, fade);
        ctx!.fillStyle = isDominant ? "rgba(35,230,179,1)" : "rgba(255,77,166,1)";
        ctx!.fillRect(s.x + 2, 14, CELL - 4, h - 28);
        ctx!.globalAlpha = Math.max(0.2, fade);
        ctx!.fillStyle = SYM_COLORS[s.sym % SYM_COLORS.length];
        ctx!.fillText(syms[s.sym] ?? "?", cx, h / 2);
      }
      ctx!.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [n]);

  // reset stream when alphabet changes so symbols stay valid
  useEffect(() => {
    streamRef.current = [];
  }, [n]);

  const syms = ALPHABETS[n];

  return (
    <div className="w-full">
      {/* streaming row */}
      <div className="holo rounded-xl p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="label-mono">
            {lang === "zh" ? "符号流 · 香农信源" : "Symbol Stream · Shannon Source"}
          </span>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-full border border-signal-500/30 px-3 py-1 font-mono text-[0.7rem] text-signal-300 transition hover:bg-signal-500/15"
          >
            {running ? (lang === "zh" ? "暂停 ❚❚" : "Pause ❚❚") : (lang === "zh" ? "运行 ▶" : "Run ▶")}
          </button>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-signal-500/10 bg-void-950/60">
          <canvas ref={canvasRef} className="block h-[84px] w-full" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-void-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-void-950 to-transparent" />
        </div>
        <p className="mt-2 font-mono text-[0.66rem] text-ghost-500">
          {pred < 0.2
            ? (lang === "zh" ? "// 接近均匀随机 — 最大熵 / 纯噪声" : "// near-uniform random — max entropy / pure noise")
            : pred > 0.8
            ? (lang === "zh" ? "// 几乎确定 — 零熵 / 纯秩序 / 模式" : "// almost deterministic — zero entropy / pure order / pattern")
            : (lang === "zh" ? "// 有偏分布 — 部分可预测" : "// biased distribution — partly predictable")}
        </p>
      </div>

      {/* controls */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="holo rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="label-mono">{lang === "zh" ? "可预测性" : "Predictability"}</span>
            <span className="mono text-sm text-signal-300">{pred.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={pred}
            onChange={(e) => setPred(parseFloat(e.target.value))}
            className="mt-3 w-full accent-signal-500"
            aria-label="predictability"
          />
          <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ghost-500">
            <span className="pulse-text">{lang === "zh" ? "噪声" : "noise"}</span>
            <span className="signal-text">{lang === "zh" ? "秩序" : "order"}</span>
          </div>
        </div>

        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "字母表大小 N" : "Alphabet size N"}</span>
          <div className="mt-3 flex gap-2">
            {[2, 4, 8].map((opt) => (
              <button
                key={opt}
                onClick={() => setN(opt)}
                className={`flex-1 rounded-lg border px-3 py-2 font-mono text-sm transition ${
                  n === opt
                    ? "border-signal-500/50 bg-signal-500/15 text-signal-300"
                    : "border-ghost-700 text-ghost-300 hover:border-signal-500/30"
                }`}
              >
                {opt === 2 ? "2 · 0/1" : `${opt}`}
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[0.62rem] text-ghost-500">
            {lang === "zh" ? `最大熵 = log₂(${n}) = ${maxH.toFixed(2)} 比特/符号` : `max H = log₂(${n}) = ${maxH.toFixed(2)} bits/sym`}
          </p>
        </div>
      </div>

      {/* readouts */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={{ en: "Entropy H", zh: "熵 H" }} value={`${H.toFixed(2)}`} unit={lang === "zh" ? "比特/符号" : "bits/sym"} accent="flux" />
        <Stat label={{ en: "Max H", zh: "最大熵" }} value={`${maxH.toFixed(2)}`} unit={lang === "zh" ? "比特/符号" : "bits/sym"} accent="signal" />
        <Stat label={{ en: "Redundancy", zh: "冗余度" }} value={`${redundancy.toFixed(0)}`} unit="%" accent="wire" />
        <Stat label={{ en: "Surprise/sym", zh: "惊异/符号" }} value={`${(H / Math.max(maxH, 0.0001) * 100).toFixed(0)}`} unit="%" accent="pulse" />
      </div>

      {/* compression contrast + prob bars */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* compression */}
        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "压缩 · 4096 符号消息" : "Compression · 4096-symbol message"}</span>
          <div className="mt-4 space-y-3">
            <Bar
              label={{ en: "Raw (fixed-width)", zh: "原始（定宽）" }}
              widthPct={100}
              colorClass="bg-ghost-500/60"
              value={`${rawBits.toLocaleString()} ${lang === "zh" ? "比特" : "bits"}`}
            />
            <Bar
              label={{ en: "Entropy limit", zh: "熵下限" }}
              widthPct={Math.max(2, ratio * 100)}
              colorClass="bg-gradient-to-r from-signal-500 to-wire-500"
              value={`${compBits.toLocaleString()} ${lang === "zh" ? "比特" : "bits"}`}
            />
          </div>
          <p className="mt-3 font-mono text-[0.66rem] text-ghost-500">
            {lang === "zh"
              ? `≈ ${(ratio * 100).toFixed(0)}% 大小 · 节省 ${(100 - ratio * 100).toFixed(0)}%（香农信源编码定理）`
              : `≈ ${(ratio * 100).toFixed(0)}% of size · saves ${(100 - ratio * 100).toFixed(0)}% (Shannon's source-coding theorem)`}
          </p>
        </div>

        {/* probability bar chart */}
        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "符号概率 p(x)" : "Symbol probabilities p(x)"}</span>
          <div className="mt-4 flex h-32 items-end gap-2">
            {dist.map((p, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end">
                <span className="mono mb-1 text-[0.6rem] text-signal-300">{(p * 100).toFixed(0)}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-signal-600 to-signal-400 transition-all duration-300"
                  style={{ height: `${Math.max(2, p * 100)}%`, boxShadow: "0 0 14px -2px rgba(35,230,179,0.5)" }}
                />
                <span className="mono mt-1 text-[0.66rem] text-ghost-300">{syms[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* conceptual strip */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CONCEPTS.map((c, i) => (
          <div key={i} className={`rounded-lg border bg-void-900/50 p-3 ${c.cls}`}>
            <div className="display text-sm">
              <T v={c.k} />
            </div>
            <p className="mt-1 text-[0.72rem] leading-snug text-ghost-300">
              <T v={c.v} />
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-[0.66rem] text-flux-400">
        <T v={{ en: "Entropy measures surprise, not meaning. — Shannon, 1948", zh: "熵衡量的是惊异，而非意义。——香农，1948" }} />
      </p>
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: Bi; value: string; unit: string; accent: "signal" | "flux" | "pulse" | "wire" }) {
  const txt = { signal: "text-signal-300", flux: "text-flux-400", pulse: "text-pulse-400", wire: "text-wire-400" }[accent];
  return (
    <div className="holo rounded-xl p-3 text-center">
      <div className="label-mono">
        <T v={label} />
      </div>
      <div className={`mono mt-1 text-2xl ${txt}`}>{value}</div>
      <div className="font-mono text-[0.58rem] text-ghost-500">{unit}</div>
    </div>
  );
}

function Bar({ label, widthPct, colorClass, value }: { label: Bi; widthPct: number; colorClass: string; value: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[0.66rem] text-ghost-300">
        <T v={label} />
        <span className="text-ghost-200">{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded bg-void-950/70 ring-1 ring-inset ring-ghost-700/50">
        <div className={`h-full rounded transition-all duration-500 ${colorClass}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
