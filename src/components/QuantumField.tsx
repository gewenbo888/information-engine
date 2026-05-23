"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, T, type Bi } from "./lang";

/* ------------------------------------------------------------------ *
 * QUANTUM INFORMATION — bits vs qubits; does the universe compute?
 * Bloch-sphere qubit visualiser + Born-rule measurement + Bell pair.
 * Physics kept qualitatively accurate; no hype.
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

/* project a 3D point (Bloch sphere, radius R, centred at cx,cy) to 2D screen.
 * Simple isometric-ish projection: x→right, z→up, y→depth (slight tilt). */
function project(x: number, y: number, z: number, cx: number, cy: number, R: number) {
  const tilt = 0.42; // foreshorten depth axis
  const sx = cx + x * R + y * R * 0.34;
  const sy = cy - z * R + y * R * 0.18 * tilt;
  return { sx, sy };
}

export default function QuantumField() {
  const { lang } = useLang();

  // single qubit state on Bloch sphere
  const [theta, setTheta] = useState(1.05); // polar 0..π
  const [phi, setPhi] = useState(0.85); // azimuth 0..2π

  // measurement
  const [tally, setTally] = useState<{ zero: number; one: number }>({ zero: 0, one: 0 });
  const [collapsed, setCollapsed] = useState<null | 0 | 1>(null);
  const [animState, setAnimState] = useState<{ from: { t: number; p: number }; to: 0 | 1; prog: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Bell pair
  const [bellA, setBellA] = useState<null | 0 | 1>(null);
  const [bellB, setBellB] = useState<null | 0 | 1>(null);
  const [bellAnim, setBellAnim] = useState(0); // 0..1 correlation sweep
  const bellRafRef = useRef<number | null>(null);

  const p0 = Math.cos(theta / 2) ** 2;
  const p1 = Math.sin(theta / 2) ** 2;
  const alpha = Math.cos(theta / 2);
  const betaMag = Math.sin(theta / 2);

  // live Bloch vector (collapsed snaps θ to 0 or π)
  const effTheta = animState ? lerpAngle(animState.from.t, animState.to === 0 ? 0 : Math.PI, easeOut(animState.prog)) : theta;
  const effPhi = animState ? animState.from.p : phi;

  const bloch = useMemo(() => {
    const x = Math.sin(effTheta) * Math.cos(effPhi);
    const y = Math.sin(effTheta) * Math.sin(effPhi);
    const z = Math.cos(effTheta);
    return { x, y, z };
  }, [effTheta, effPhi]);

  function measure() {
    if (animState) return;
    const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
    setCollapsed(null);
    setAnimState({ from: { t: theta, p: phi }, to: outcome, prog: 0 });
  }

  useEffect(() => {
    if (!animState) return;
    let start: number | null = null;
    const DUR = 650;
    function step(ts: number) {
      if (start === null) start = ts;
      const prog = Math.min(1, (ts - start) / DUR);
      setAnimState((s) => (s ? { ...s, prog } : s));
      if (prog < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        const out = animStateRef.current!.to;
        setCollapsed(out);
        setTheta(out === 0 ? 0.0001 : Math.PI - 0.0001);
        setTally((tl) => (out === 0 ? { ...tl, zero: tl.zero + 1 } : { ...tl, one: tl.one + 1 }));
        setAnimState(null);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animState !== null]);

  const animStateRef = useRef(animState);
  animStateRef.current = animState;

  function measureBell() {
    if (bellAnim > 0 && bellAnim < 1) return;
    const a: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    const b: 0 | 1 = a; // |Φ+> Bell state → perfectly correlated outcomes
    setBellA(a);
    setBellB(null);
    setBellAnim(0.0001);
    let start: number | null = null;
    const DUR = 900;
    function step(ts: number) {
      if (start === null) start = ts;
      const prog = Math.min(1, (ts - start) / DUR);
      setBellAnim(prog);
      if (prog >= 0.5 && bellB === null) setBellB(b);
      if (prog < 1) {
        bellRafRef.current = requestAnimationFrame(step);
      }
    }
    bellRafRef.current = requestAnimationFrame(step);
  }
  function resetBell() {
    if (bellRafRef.current !== null) cancelAnimationFrame(bellRafRef.current);
    setBellA(null);
    setBellB(null);
    setBellAnim(0);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (bellRafRef.current !== null) cancelAnimationFrame(bellRafRef.current);
    };
  }, []);

  const total = tally.zero + tally.one;
  const cx = 90;
  const cy = 92;
  const R = 70;

  // arrow tip in screen space
  const tip = project(bloch.x, bloch.y, bloch.z, cx, cy, R);
  // pole / axis ends
  const top = project(0, 0, 1, cx, cy, R);
  const bot = project(0, 0, -1, cx, cy, R);
  const xEnd = project(1, 0, 0, cx, cy, R);
  const yEnd = project(0, 1, 0, cx, cy, R);

  return (
    <div className="w-full">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* ---- Bloch sphere qubit ---- */}
        <div className="holo rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-mono">{lang === "zh" ? "量子比特 · 布洛赫球" : "Qubit · Bloch sphere"}</span>
            <span className="mono text-[0.62rem] text-ghost-500">
              {collapsed !== null ? (lang === "zh" ? "已坍缩" : "collapsed") : lang === "zh" ? "叠加态" : "superposition"}
            </span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg border border-pulse-500/12 bg-void-950/60">
            <svg viewBox="0 0 180 184" className="block w-full">
              {/* sphere body */}
              <defs>
                <radialGradient id="sphereFill" cx="40%" cy="32%" r="75%">
                  <stop offset="0%" stopColor="rgba(47,198,245,0.16)" />
                  <stop offset="55%" stopColor="rgba(255,77,166,0.06)" />
                  <stop offset="100%" stopColor="rgba(4,7,13,0.0)" />
                </radialGradient>
              </defs>
              <circle cx={cx} cy={cy} r={R} fill="url(#sphereFill)" stroke="rgba(103,216,251,0.28)" strokeWidth="0.7" />
              {/* equator ellipse (depth-foreshortened) */}
              <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.32} fill="none" stroke="rgba(103,216,251,0.22)" strokeWidth="0.6" />
              {/* meridian */}
              <ellipse cx={cx} cy={cy} rx={R * 0.32} ry={R} fill="none" stroke="rgba(255,121,191,0.16)" strokeWidth="0.6" />

              {/* axes */}
              <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy} stroke="rgba(154,249,225,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1={cx} y1={cy} x2={xEnd.sx} y2={xEnd.sy} stroke="rgba(255,200,97,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1={cx} y1={cy} x2={yEnd.sx} y2={yEnd.sy} stroke="rgba(255,200,97,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />

              {/* pole labels */}
              <text x={top.sx} y={top.sy - 3} textAnchor="middle" fontSize="6" fontFamily='"IBM Plex Mono", monospace' fill="#5cf2cc">|0⟩</text>
              <text x={bot.sx} y={bot.sy + 8} textAnchor="middle" fontSize="6" fontFamily='"IBM Plex Mono", monospace' fill="#ff79bf">|1⟩</text>

              {/* state vector arrow */}
              <line
                x1={cx}
                y1={cy}
                x2={tip.sx}
                y2={tip.sy}
                stroke={collapsed !== null ? "#ffc861" : "#ff4da6"}
                strokeWidth="1.4"
                style={{ transition: animState ? "none" : "all 0.12s linear" }}
              />
              <circle cx={tip.sx} cy={tip.sy} r="2.4" fill={collapsed !== null ? "#ffc861" : "#ff4da6"} className={collapsed === null ? "glow-pulse" : ""} />
              {/* projection to z-axis (probability geometry) */}
              {(() => {
                const zfoot = project(0, 0, bloch.z, cx, cy, R);
                return <line x1={tip.sx} y1={tip.sy} x2={zfoot.sx} y2={zfoot.sy} stroke="rgba(154,249,225,0.3)" strokeWidth="0.4" strokeDasharray="1 1.5" />;
              })()}
              <circle cx={cx} cy={cy} r="1.2" fill="#dde9e6" />
            </svg>
          </div>

          {/* sliders */}
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="label-mono">θ {lang === "zh" ? "极角" : "polar"}</span>
                <span className="mono text-[0.7rem] text-wire-400">{(theta).toFixed(2)} rad · {((theta / Math.PI) * 180).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.PI}
                step={0.01}
                value={theta}
                onChange={(e) => {
                  setTheta(parseFloat(e.target.value));
                  setCollapsed(null);
                }}
                className="mt-2 w-full accent-pulse-500"
                aria-label="theta"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="label-mono">φ {lang === "zh" ? "方位角" : "azimuth"}</span>
                <span className="mono text-[0.7rem] text-wire-400">{(phi).toFixed(2)} rad · {((phi / TAU) * 360).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={TAU}
                step={0.01}
                value={phi}
                onChange={(e) => {
                  setPhi(parseFloat(e.target.value));
                  setCollapsed(null);
                }}
                className="mt-2 w-full accent-wire-500"
                aria-label="phi"
              />
            </div>
          </div>

          {/* amplitudes + probs */}
          <div className="mt-3 rounded-lg border border-wire-500/15 bg-void-950/50 p-3">
            <div className="mono text-center text-[0.82rem] text-ghost-100">
              |ψ⟩ = <span className="signal-text">{alpha.toFixed(3)}</span> |0⟩ +{" "}
              <span className="pulse-text">{(betaMag * Math.cos(phi)).toFixed(3)}{betaMag * Math.sin(phi) >= 0 ? "+" : "−"}{Math.abs(betaMag * Math.sin(phi)).toFixed(3)}i</span> |1⟩
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ProbBar label="P(0) = cos²(θ/2)" p={p0} color="#5cf2cc" />
              <ProbBar label="P(1) = sin²(θ/2)" p={p1} color="#ff79bf" />
            </div>
          </div>

          {/* measure + histogram */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={measure}
              disabled={!!animState}
              className="rounded-full border border-flux-500/40 px-4 py-1.5 font-mono text-[0.72rem] text-flux-400 transition hover:bg-flux-500/15 disabled:opacity-40"
            >
              {lang === "zh" ? "测量 ⟶" : "Measure ⟶"}
            </button>
            {collapsed !== null && (
              <span className="mono text-sm text-flux-400">
                → |{collapsed}⟩
              </span>
            )}
            <button
              onClick={() => setTally({ zero: 0, one: 0 })}
              className="ml-auto font-mono text-[0.62rem] text-ghost-500 transition hover:text-ghost-200"
            >
              {lang === "zh" ? "清空" : "reset"}
            </button>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between font-mono text-[0.6rem] text-ghost-500">
              <span>{lang === "zh" ? "测量直方图（玻恩定则）" : "measurement histogram (Born rule)"}</span>
              <span className="mono text-ghost-300">n = {total}</span>
            </div>
            <div className="flex h-16 items-end gap-3">
              <HistCol label="0" count={tally.zero} total={total} pTheory={p0} color="#5cf2cc" lang={lang} />
              <HistCol label="1" count={tally.one} total={total} pTheory={p1} color="#ff79bf" lang={lang} />
            </div>
            <p className="mt-2 font-mono text-[0.6rem] leading-snug text-ghost-500">
              {lang === "zh"
                ? "// 单次结果随机；多次测量重现 P(0)、P(1) 的分布。"
                : "// each outcome is random; many measurements reproduce P(0), P(1)."}
            </p>
          </div>
        </div>

        {/* ---- entanglement + concept ---- */}
        <div className="flex flex-col gap-4">
          {/* Bell pair */}
          <div className="holo rounded-xl p-4">
            <span className="label-mono">{lang === "zh" ? "纠缠 · 贝尔对 (Φ⁺)" : "Entanglement · Bell pair (Φ⁺)"}</span>
            <p className="mt-1 mono text-center text-[0.74rem] text-ghost-200">
              |Φ⁺⟩ = <span className="wire-text">(|00⟩ + |11⟩)</span> / √2
            </p>

            <div className="relative mt-3 flex items-center justify-between px-2">
              <Qubit label="A" outcome={bellA} active={bellAnim > 0} lang={lang} />
              {/* correlation link */}
              <div className="relative mx-3 h-1 flex-1 overflow-hidden rounded bg-void-950 ring-1 ring-inset ring-wire-500/20">
                <div
                  className="h-full rounded bg-gradient-to-r from-wire-500 to-pulse-500"
                  style={{ width: `${bellAnim * 100}%`, transition: "width 0.05s linear", boxShadow: "0 0 12px -2px rgba(47,198,245,0.7)" }}
                />
              </div>
              <Qubit label="B" outcome={bellB} active={bellAnim > 0} lang={lang} />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={measureBell}
                disabled={bellAnim > 0 && bellAnim < 1}
                className="rounded-full border border-wire-500/40 px-4 py-1.5 font-mono text-[0.72rem] text-wire-400 transition hover:bg-wire-500/15 disabled:opacity-40"
              >
                {lang === "zh" ? "测量 A ⟶" : "Measure A ⟶"}
              </button>
              <button
                onClick={resetBell}
                className="ml-auto font-mono text-[0.62rem] text-ghost-500 transition hover:text-ghost-200"
              >
                {lang === "zh" ? "重置" : "reset"}
              </button>
            </div>

            {bellA !== null && bellB !== null && (
              <p className="mt-2 mono text-center text-[0.74rem] text-flux-400">
                A = |{bellA}⟩ &nbsp;⟺&nbsp; B = |{bellB}⟩ &nbsp;
                <span className="text-signal-300">{lang === "zh" ? "（完全相关）" : "(perfectly correlated)"}</span>
              </p>
            )}

            <p className="mt-2 font-mono text-[0.6rem] leading-snug text-ghost-500">
              {lang === "zh"
                ? "// 测量 A 立即确定 B 的关联结果。这是真实的，但无法以超光速传递信息——结果本身是随机的。"
                : "// measuring A instantly fixes B's correlated outcome. real, yet cannot send information faster than light — the outcome itself is random."}
            </p>
          </div>

          {/* concept panel */}
          <div className="holo rounded-xl p-4">
            <span className="label-mono">{lang === "zh" ? "信息即物理" : "Information is physical"}</span>
            <div className="mt-3 space-y-3">
              <Concept
                k={{ en: "Bit vs Qubit", zh: "比特 vs 量子比特" }}
                v={{
                  en: "A bit is 0 or 1. A qubit is a direction on a sphere — a superposition that, on measurement, becomes one classical bit.",
                  zh: "比特非 0 即 1。量子比特是球面上的一个方向——一种叠加态，测量时坍缩为一个经典比特。",
                }}
                cls="text-pulse-400 border-pulse-500/25"
              />
              <Concept
                k={{ en: "Bekenstein bound · holography", zh: "贝肯斯坦上限 · 全息原理" }}
                v={{
                  en: "The information a region can hold scales with its bounding surface area, not its volume — as if reality's storage lives on a boundary.",
                  zh: "一个区域能容纳的信息量正比于其边界面积，而非体积——仿佛现实的存储位于边界之上。",
                }}
                cls="text-wire-400 border-wire-500/25"
              />
              <Concept
                k={{ en: "Black-hole information paradox", zh: "黑洞信息悖论" }}
                v={{
                  en: "If a black hole evaporates, where does the information that fell in go? Quantum mechanics says it cannot vanish. Still debated.",
                  zh: "若黑洞蒸发，落入其中的信息去了哪里？量子力学称信息不能消失。至今仍有争议。",
                }}
                cls="text-flux-400 border-flux-500/25"
              />
              <Concept
                k={{ en: "Wheeler's 'it from bit'", zh: "惠勒的「万物源于比特」" }}
                v={{
                  en: "Does reality fundamentally compute? Digital physics asks whether every 'it' derives from yes/no answers. An open question — stated as open.",
                  zh: "现实在本质上是在计算吗？数字物理学追问：每个「物」是否都源于是/否的答案。这是一个开放问题——我们如实存疑。",
                }}
                cls="text-signal-300 border-signal-500/25"
              />
            </div>
          </div>
        </div>
      </div>

      {/* caption */}
      <div className="mt-4 holo rounded-xl p-4">
        <div className="h-px rule-sig" />
        <p className="mt-3 text-[0.82rem] leading-relaxed text-ghost-200">
          <T
            v={{
              en: "Classical information is the bit; quantum information is the qubit, where superposition and entanglement let a system hold correlations no list of bits can express. Measurement converts the quantum to the classical — probabilistically, by the Born rule. Whether the universe is, at bottom, a computation remains genuinely open.",
              zh: "经典信息以比特为单位；量子信息以量子比特为单位——叠加与纠缠使系统持有任何比特清单都无法表达的关联。测量把量子转化为经典——依玻恩定则，以概率方式进行。宇宙在最底层是否就是一场计算，至今仍是真正开放的问题。",
            }}
          />
        </p>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}
function lerpAngle(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function ProbBar({ label, p, color }: { label: string; p: number; color: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[0.58rem] text-ghost-300">{label}</div>
      <div className="flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded bg-void-950 ring-1 ring-inset ring-ghost-700/50">
          <div
            className="absolute inset-y-0 left-0 rounded transition-all duration-150"
            style={{ width: `${p * 100}%`, background: color, boxShadow: `0 0 10px -2px ${color}` }}
          />
        </div>
        <span className="w-12 text-right font-mono text-[0.66rem]" style={{ color }}>
          {(p * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function HistCol({
  label,
  count,
  total,
  pTheory,
  color,
  lang,
}: {
  label: string;
  count: number;
  total: number;
  pTheory: number;
  color: string;
  lang: "en" | "zh";
}) {
  const frac = total > 0 ? count / total : 0;
  return (
    <div className="flex flex-1 flex-col items-center justify-end" title={lang === "zh" ? "理论值标记" : "theory marker"}>
      <span className="mono mb-0.5 text-[0.58rem]" style={{ color }}>
        {count}
      </span>
      <div className="relative flex h-12 w-full items-end">
        <div
          className="w-full rounded-t transition-all duration-300"
          style={{ height: `${Math.max(2, frac * 100)}%`, background: color, boxShadow: `0 0 12px -2px ${color}` }}
        />
        {/* theory tick */}
        <div
          className="absolute left-0 right-0 h-px bg-ghost-200/70"
          style={{ bottom: `${pTheory * 100}%` }}
          title="theory"
        />
      </div>
      <span className="mono mt-1 text-[0.62rem] text-ghost-300">|{label}⟩</span>
    </div>
  );
}

function Qubit({ label, outcome, active, lang }: { label: string; outcome: null | 0 | 1; active: boolean; lang: "en" | "zh" }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border ${
          outcome !== null ? "border-flux-500/50 bg-flux-500/10" : "border-wire-500/30 bg-void-950/60"
        } ${active && outcome === null ? "glow-pulse" : ""}`}
        style={outcome !== null ? { boxShadow: "0 0 18px -4px rgba(245,179,56,0.6)" } : undefined}
      >
        <span className={`mono text-sm ${outcome !== null ? "text-flux-400" : "wire-text"}`}>
          {outcome !== null ? `|${outcome}⟩` : "?"}
        </span>
      </div>
      <span className="mono mt-1 text-[0.6rem] text-ghost-300">
        {lang === "zh" ? "量子比特 " : "qubit "}
        {label}
      </span>
    </div>
  );
}

function Concept({ k, v, cls }: { k: Bi; v: Bi; cls: string }) {
  return (
    <div className={`rounded-lg border bg-void-900/40 p-3 ${cls}`}>
      <div className="display text-[0.86rem]">
        <T v={k} />
      </div>
      <p className="mt-1 text-[0.74rem] leading-snug text-ghost-300">
        <T v={v} />
      </p>
    </div>
  );
}
