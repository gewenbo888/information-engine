"use client";

import { useState } from "react";
import { useLang, T, t } from "./lang";
import { META_TERMS, PROFILE_SYSTEMS } from "./content";

/**
 * Meta-model radar: Information Power as the sum of seven capacities.
 * Overlay the profiles of different information systems and compare shapes.
 */
export default function InfoPowerModel() {
  const { lang } = useLang();
  const [on, setOn] = useState<boolean[]>(PROFILE_SYSTEMS.map((_, i) => i === 0 || i === 4));
  const [hovered, setHovered] = useState<number | null>(null);

  // compact spoke labels so long English names don't clip the viewBox
  const SHORT_EN: Record<string, string> = {
    compression: "Compress",
    transmission: "Transmit",
    errorcorrection: "Correct",
    abstraction: "Abstract",
    connectivity: "Network",
    memory: "Memory",
    computation: "Compute",
  };

  const N = META_TERMS.length;
  const size = 460;
  const cx = size / 2;
  const cy = size / 2;
  const R = 156;
  const rings = [0.25, 0.5, 0.75, 1];

  const angle = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: cx + Math.cos(angle(i)) * R * r,
    y: cy + Math.sin(angle(i)) * R * r,
  });

  const polygon = (scores: number[]) =>
    scores.map((s, i) => { const p = pt(i, s / 100); return `${p.x},${p.y}`; }).join(" ");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* radar */}
      <div className="holo rounded-2xl p-4 sm:p-6">
        <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[480px]">
          {/* rings */}
          {rings.map((r, ri) => (
            <polygon
              key={ri}
              points={Array.from({ length: N }, (_, i) => { const p = pt(i, r); return `${p.x},${p.y}`; }).join(" ")}
              fill="none"
              stroke="rgba(92,242,204,0.10)"
              strokeWidth={1}
            />
          ))}
          {/* spokes + labels */}
          {META_TERMS.map((term, i) => {
            const edge = pt(i, 1);
            const lab = pt(i, 1.18);
            const active = hovered === i;
            return (
              <g key={term.key}>
                <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="rgba(92,242,204,0.12)" strokeWidth={1} />
                <circle
                  cx={edge.x}
                  cy={edge.y}
                  r={11}
                  fill={active ? "rgba(35,230,179,0.18)" : "rgba(13,28,38,0.9)"}
                  stroke="rgba(92,242,204,0.4)"
                  strokeWidth={1}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                />
                <text x={edge.x} y={edge.y + 3.5} textAnchor="middle" className="mono" fontSize={9} fill="#5cf2cc" style={{ pointerEvents: "none" }}>
                  {term.sym}
                </text>
                <text
                  x={lab.x}
                  y={lab.y}
                  textAnchor={lab.x > cx + 6 ? "start" : lab.x < cx - 6 ? "end" : "middle"}
                  dominantBaseline="middle"
                  fontSize={10.5}
                  fill={active ? "#9af9e1" : "#90a39e"}
                  className={lang === "zh" ? "zh" : "mono"}
                >
                  {lang === "zh" ? t(term.name, lang) : SHORT_EN[term.key]}
                </text>
              </g>
            );
          })}
          {/* profiles */}
          {PROFILE_SYSTEMS.map((s, si) =>
            on[si] ? (
              <g key={si} className="lang-fade">
                <polygon points={polygon(s.scores)} fill={s.accent} fillOpacity={0.1} stroke={s.accent} strokeWidth={1.8} strokeOpacity={0.85} />
                {s.scores.map((sc, i) => { const p = pt(i, sc / 100); return <circle key={i} cx={p.x} cy={p.y} r={2.6} fill={s.accent} />; })}
              </g>
            ) : null
          )}
        </svg>
      </div>

      {/* controls + readout */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="label-mono">{lang === "zh" ? "叠加系统" : "Overlay systems"}</div>
          <div className="mt-3 flex flex-col gap-2">
            {PROFILE_SYSTEMS.map((s, si) => (
              <button
                key={si}
                onClick={() => setOn((o) => o.map((v, i) => (i === si ? !v : v)))}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  on[si] ? "border-signal-500/40 bg-signal-500/10" : "border-ghost-700/40 bg-void-800/40 hover:border-ghost-500/40"
                }`}
              >
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: on[si] ? s.accent : "transparent", border: `1.5px solid ${s.accent}` }} />
                <span className={`${on[si] ? "text-ghost-50" : "text-ghost-300"} ${lang === "zh" ? "zh" : ""}`}>{t(s.name, lang)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="holo rounded-xl p-4">
          <div className="label-mono">{hovered === null ? (lang === "zh" ? "七项能力" : "Seven capacities") : `${META_TERMS[hovered].sym} · ${t(META_TERMS[hovered].name, lang)}`}</div>
          <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-ghost-200">
            {hovered === null ? (
              <T v={{ en: "Hover an axis to read its definition. Every information system is a different weighting of the same seven terms.", zh: "将指针悬停于某一轴，以读取其定义。每一个信息系统，都是这同样七个项的不同加权。" }} />
            ) : (
              <T v={META_TERMS[hovered].def} />
            )}
          </p>
        </div>

        <div className="rounded-xl border border-signal-500/20 bg-void-900/50 p-4">
          <div className="mono text-center text-[0.82rem] leading-relaxed text-signal-300">
            Information Power
          </div>
          <div className="mono mt-2 text-center text-[0.7rem] leading-relaxed text-ghost-300">
            = C + T + E + A + N + M + P
          </div>
        </div>
      </div>
    </div>
  );
}
