"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLang, T, t, type Bi } from "./lang";

/* ── molecular reference data ─────────────────────────────────────────── */

// the four DNA bases, each mapped to one of the four site accents.
type Base = "A" | "T" | "G" | "C";
const BASE_COLOR: Record<Base, string> = {
  A: "#23e6b3", // signal green
  T: "#67d8fb", // wire cyan
  G: "#ffc861", // flux amber
  C: "#ff79bf", // pulse magenta
};
const PAIR: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };
const BASE_NAME: Record<Base, Bi> = {
  A: { en: "Adenine", zh: "腺嘌呤" },
  T: { en: "Thymine", zh: "胸腺嘧啶" },
  G: { en: "Guanine", zh: "鸟嘌呤" },
  C: { en: "Cytosine", zh: "胞嘧啶" },
};

// amino acids referenced by the standard codon table (RNA: U replaces T).
type AA = { code: string; en: string; zh: string };
const AA: Record<string, AA> = {
  Phe: { code: "F", en: "Phenylalanine", zh: "苯丙氨酸" },
  Leu: { code: "L", en: "Leucine", zh: "亮氨酸" },
  Ile: { code: "I", en: "Isoleucine", zh: "异亮氨酸" },
  Met: { code: "M", en: "Methionine · Start", zh: "甲硫氨酸 · 起始" },
  Val: { code: "V", en: "Valine", zh: "缬氨酸" },
  Ser: { code: "S", en: "Serine", zh: "丝氨酸" },
  Pro: { code: "P", en: "Proline", zh: "脯氨酸" },
  Thr: { code: "T", en: "Threonine", zh: "苏氨酸" },
  Ala: { code: "A", en: "Alanine", zh: "丙氨酸" },
  Tyr: { code: "Y", en: "Tyrosine", zh: "酪氨酸" },
  His: { code: "H", en: "Histidine", zh: "组氨酸" },
  Gln: { code: "Q", en: "Glutamine", zh: "谷氨酰胺" },
  Asn: { code: "N", en: "Asparagine", zh: "天冬酰胺" },
  Lys: { code: "K", en: "Lysine", zh: "赖氨酸" },
  Asp: { code: "D", en: "Aspartate", zh: "天冬氨酸" },
  Glu: { code: "E", en: "Glutamate", zh: "谷氨酸" },
  Cys: { code: "C", en: "Cysteine", zh: "半胱氨酸" },
  Trp: { code: "W", en: "Tryptophan", zh: "色氨酸" },
  Arg: { code: "R", en: "Arginine", zh: "精氨酸" },
  Gly: { code: "G", en: "Glycine", zh: "甘氨酸" },
  Stop: { code: "*", en: "Stop", zh: "终止" },
};

// full standard genetic code, indexed by RNA codon (64 entries).
const CODON: Record<string, keyof typeof AA> = {
  UUU: "Phe", UUC: "Phe", UUA: "Leu", UUG: "Leu",
  CUU: "Leu", CUC: "Leu", CUA: "Leu", CUG: "Leu",
  AUU: "Ile", AUC: "Ile", AUA: "Ile", AUG: "Met",
  GUU: "Val", GUC: "Val", GUA: "Val", GUG: "Val",
  UCU: "Ser", UCC: "Ser", UCA: "Ser", UCG: "Ser",
  CCU: "Pro", CCC: "Pro", CCA: "Pro", CCG: "Pro",
  ACU: "Thr", ACC: "Thr", ACA: "Thr", ACG: "Thr",
  GCU: "Ala", GCC: "Ala", GCA: "Ala", GCG: "Ala",
  UAU: "Tyr", UAC: "Tyr", UAA: "Stop", UAG: "Stop",
  CAU: "His", CAC: "His", CAA: "Gln", CAG: "Gln",
  AAU: "Asn", AAC: "Asn", AAA: "Lys", AAG: "Lys",
  GAU: "Asp", GAC: "Asp", GAA: "Glu", GAG: "Glu",
  UGU: "Cys", UGC: "Cys", UGA: "Stop", UGG: "Trp",
  CGU: "Arg", CGC: "Arg", CGA: "Arg", CGG: "Arg",
  AGU: "Ser", AGC: "Ser", AGA: "Arg", AGG: "Arg",
  GGU: "Gly", GGC: "Gly", GGA: "Gly", GGG: "Gly",
};
type RNA = "A" | "U" | "C" | "G";
const RNA_COLOR: Record<RNA, string> = {
  A: BASE_COLOR.A,
  U: BASE_COLOR.T, // U occupies T's color on the RNA strand
  C: BASE_COLOR.C,
  G: BASE_COLOR.G,
};
const RNA_BASES: RNA[] = ["A", "U", "C", "G"];

/* ── helix canvas ─────────────────────────────────────────────────────── */

// a fixed strand sequence the helix renders; readable + biologically plausible.
const STRAND: Base[] = [
  "A", "T", "G", "C", "A", "A", "T", "G", "G", "C", "T", "A",
  "C", "G", "T", "A", "A", "C", "G", "G", "T", "A", "C", "T",
];

function Helix({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const phase = useRef(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(setSize) : null;
    ro?.observe(canvas);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const n = STRAND.length;
      const amp = Math.min(w * 0.16, 78);
      const cx = w / 2;
      const stepY = h / (n + 1);
      // sample the two backbones, 180° out of phase.
      const pts: { x1: number; x2: number; y: number; depth: number; base: Base }[] = [];
      for (let i = 0; i < n; i++) {
        const y = stepY * (i + 1);
        const ang = phase.current + i * 0.52;
        const x1 = cx + Math.sin(ang) * amp;
        const x2 = cx + Math.sin(ang + Math.PI) * amp;
        const depth = (Math.cos(ang) + 1) / 2; // 0 (back) .. 1 (front)
        pts.push({ x1, x2, y, base: STRAND[i], depth });
      }

      // rungs (base-pair bonds) first so backbones sit on top.
      for (const p of pts) {
        const c1 = BASE_COLOR[p.base];
        const c2 = BASE_COLOR[PAIR[p.base]];
        const grad = ctx.createLinearGradient(p.x1, p.y, p.x2, p.y);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.5, "rgba(15,28,38,0.35)");
        grad.addColorStop(1, c2);
        ctx.globalAlpha = 0.35 + p.depth * 0.6;
        ctx.lineWidth = 1.6 + p.depth * 2.4;
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y);
        ctx.lineTo(p.x2, p.y);
        ctx.stroke();
        // base nodes
        const r = 2.4 + p.depth * 3.4;
        ctx.globalAlpha = 0.55 + p.depth * 0.45;
        ctx.shadowBlur = 10 * p.depth;
        ctx.shadowColor = c1;
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(p.x1, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = c2;
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.arc(p.x2, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // the two sugar-phosphate backbones as smooth ribbons.
      ctx.globalAlpha = 1;
      for (const side of [0, 1] as const) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = side === 0 ? pts[i].x1 : pts[i].x2;
          if (i === 0) ctx.moveTo(x, pts[i].y);
          else ctx.lineTo(x, pts[i].y);
        }
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(35,230,179,0.85)");
        g.addColorStop(0.5, "rgba(47,198,245,0.8)");
        g.addColorStop(1, "rgba(255,77,166,0.78)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.6;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(35,230,179,0.5)";
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (playing) phase.current += 0.018;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      ro?.disconnect();
    };
  }, [playing]);

  return <canvas ref={ref} className="h-[340px] w-full sm:h-[420px]" aria-hidden />;
}

/* ── codon translator ─────────────────────────────────────────────────── */

function codonsFor(target: keyof typeof AA): string[] {
  return Object.keys(CODON).filter((c) => CODON[c] === target);
}

/* ── main component ───────────────────────────────────────────────────── */

export default function DNAHelix() {
  const { lang } = useLang();
  const [playing, setPlaying] = useState(true);
  const [codon, setCodon] = useState<RNA[]>(["A", "U", "G"]);
  const [step, setStep] = useState(0);

  const key = codon.join("");
  const aaKey = CODON[key];
  const aa = AA[aaKey];
  const synonyms = useMemo(() => codonsFor(aaKey), [aaKey]);
  const isStop = aaKey === "Stop";

  // DNA template (complement of mRNA, with T for U) for the stepper caption.
  const dnaTemplate = codon.map((b) => (b === "U" ? "A" : b === "A" ? "T" : b === "C" ? "G" : "C")).join("");

  const setPos = (i: number, b: RNA) => {
    setCodon((c) => c.map((x, j) => (j === i ? b : x)));
  };
  const randomize = () => {
    setCodon(Array.from({ length: 3 }, () => RNA_BASES[Math.floor(Math.random() * 4)]));
  };

  const steps: { tag: string; lab: Bi; body: Bi }[] = [
    {
      tag: "DNA",
      lab: { en: "DNA template", zh: "DNA 模板" },
      body: {
        en: `The gene is stored as the double-stranded sequence 5′-${dnaTemplate}-3′. Each base is one of 4 symbols — exactly 2 bits.`,
        zh: `基因以双链序列 5′-${dnaTemplate}-3′ 存储。每个碱基是 4 个符号之一——正好 2 比特。`,
      },
    },
    {
      tag: "mRNA",
      lab: { en: "Transcription → mRNA", zh: "转录 → mRNA" },
      body: {
        en: `RNA polymerase copies the strand, substituting U for T. The messenger codon reads 5′-${key}-3′.`,
        zh: `RNA 聚合酶复制该链，用 U 替代 T。信使密码子读作 5′-${key}-3′。`,
      },
    },
    {
      tag: "PROTEIN",
      lab: { en: "Translation → protein", zh: "翻译 → 蛋白质" },
      body: isStop
        ? {
            en: `At the ribosome this codon is read as STOP — the polypeptide chain is released. The code itself signals "end of message".`,
            zh: `在核糖体处，该密码子被读作"终止"——多肽链被释放。编码本身传递"信息结束"的信号。`,
          }
        : {
            en: `The ribosome matches the codon to tRNA and appends ${aa.en} (${aa.code}) to the growing protein chain.`,
            zh: `核糖体将密码子与 tRNA 匹配，把 ${aa.zh}（${aa.code}）接到正在延长的蛋白质链上。`,
          },
    },
  ];

  return (
    <div className="w-full">
      {/* thesis strip */}
      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ghost-300">
        <T
          v={{
            en: "Life is self-replicating, error-correcting information. Four chemical symbols — A, T, G, C — encode every organism, copied with a fidelity no human storage medium has ever matched.",
            zh: "生命是能自我复制、自我纠错的信息。四个化学符号——A、T、G、C——编码了每一个生物体，其复制保真度是任何人造存储介质都无法企及的。",
          }}
        />
      </p>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        {/* ── helix column ── */}
        <div className="holo dot-bg relative overflow-hidden rounded-2xl p-4">
          <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
            <div className="scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-signal-500/10 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-mono">
                <T v={{ en: "Double Helix", zh: "双螺旋" }} />
              </span>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="rounded-full border border-signal-500/30 px-3 py-1 font-mono text-[0.7rem] text-signal-300 transition hover:bg-signal-500/15"
                aria-pressed={playing}
              >
                {playing ? t({ en: "⏸ Pause", zh: "⏸ 暂停" }, lang) : t({ en: "▶ Rotate", zh: "▶ 旋转" }, lang)}
              </button>
            </div>
            <Helix playing={playing} />
            {/* base legend */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              {(["A", "T", "G", "C"] as Base[]).map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                    style={{ background: BASE_COLOR[b], boxShadow: `0 0 8px ${BASE_COLOR[b]}` }}
                  />
                  <span className="mono text-xs text-ghost-200">
                    <b className="text-ghost-50">{b}</b> <T v={BASE_NAME[b]} />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[0.7rem] leading-relaxed text-ghost-500">
              <T
                v={{
                  en: "Pairing rule: A bonds T, G bonds C. Each rung is one complementary base pair — the redundancy that lets a single strand rebuild its partner.",
                  zh: "配对规则：A 配 T，G 配 C。每一横档是一对互补碱基——正是这种冗余让单链得以重建其互补链。",
                }}
              />
            </p>
          </div>
        </div>

        {/* ── codon translator column ── */}
        <div className="holo rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-mono">
              <T v={{ en: "Genetic Code · Codon → Amino Acid", zh: "遗传密码 · 密码子 → 氨基酸" }} />
            </span>
            <button
              onClick={randomize}
              className="rounded-full border border-wire-500/30 px-3 py-1 font-mono text-[0.7rem] text-wire-400 transition hover:bg-wire-500/15"
            >
              <T v={{ en: "⟳ Random", zh: "⟳ 随机" }} />
            </button>
          </div>

          {/* three-position picker */}
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-void-500/60 bg-void-900/60 p-2">
                <div className="mb-1.5 text-center font-mono text-[0.6rem] uppercase tracking-widest text-ghost-500">
                  {t({ en: "Pos", zh: "位" }, lang)} {i + 1}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {RNA_BASES.map((b) => {
                    const on = codon[i] === b;
                    return (
                      <button
                        key={b}
                        onClick={() => setPos(i, b)}
                        className="mono rounded-md py-1.5 text-sm font-bold transition"
                        style={{
                          color: on ? "#04070d" : RNA_COLOR[b],
                          background: on ? RNA_COLOR[b] : "rgba(255,255,255,0.03)",
                          border: `1px solid ${on ? RNA_COLOR[b] : "rgba(255,255,255,0.08)"}`,
                          boxShadow: on ? `0 0 14px -2px ${RNA_COLOR[b]}` : "none",
                        }}
                        aria-pressed={on}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* readout */}
          <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-signal-500/20 bg-void-900/70 p-3">
            <div className="font-mono text-2xl tracking-wider">
              {codon.map((b, i) => (
                <span key={i} style={{ color: RNA_COLOR[b], textShadow: `0 0 14px ${RNA_COLOR[b]}` }}>
                  {b}
                </span>
              ))}
            </div>
            <span className="text-ghost-500">→</span>
            <div className="min-w-0">
              <div
                className={`display text-lg leading-none ${isStop ? "pulse-text" : "signal-text"}`}
              >
                <T v={{ en: aa.en, zh: aa.zh }} />
              </div>
              <div className="mono mt-0.5 text-[0.7rem] text-ghost-500">
                {isStop
                  ? t({ en: "termination codon", zh: "终止密码子" }, lang)
                  : `${t({ en: "single-letter", zh: "单字母" }, lang)} · ${aa.code}`}
              </div>
            </div>
          </div>

          {/* redundancy / synonyms */}
          <div className="mt-3 rounded-xl border border-flux-500/20 bg-void-900/50 p-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="label-mono" style={{ color: "#ffc861", letterSpacing: "0.2em" }}>
                <T v={{ en: "Redundancy", zh: "冗余度" }} />
              </span>
              <span className="mono text-xs text-flux-400">
                {synonyms.length}× {t({ en: "codons", zh: "个密码子" }, lang)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {synonyms.map((c) => {
                const active = c === key;
                return (
                  <button
                    key={c}
                    onClick={() => setCodon(c.split("") as RNA[])}
                    className="mono rounded px-2 py-0.5 text-xs transition"
                    style={{
                      color: active ? "#04070d" : "#ffc861",
                      background: active ? "#ffc861" : "rgba(245,179,56,0.1)",
                      border: "1px solid rgba(245,179,56,0.3)",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-ghost-300">
              <T
                v={{
                  en: `${synonyms.length > 1 ? `${synonyms.length} different codons specify the same outcome.` : "This codon is the lone spelling for its outcome."} 64 codons map to 20 amino acids + Stop — so the code is degenerate, and many single-base typos still translate correctly. That is built-in error tolerance.`,
                  zh: `${synonyms.length > 1 ? `${synonyms.length} 个不同的密码子指向同一结果。` : "这是其结果的唯一拼写。"} 64 个密码子映射到 20 种氨基酸 + 终止——因此密码是简并的，许多单碱基错字仍能正确翻译。这就是内建的容错。`,
                }}
              />
            </p>
          </div>

          {/* bits-per-codon math */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { v: "2 bit", l: { en: "per base", zh: "每碱基" } as Bi, c: "text-signal-400" },
              { v: "6 bit", l: { en: "per codon", zh: "每密码子" } as Bi, c: "text-wire-400" },
              { v: "1 / 20", l: { en: "addresses an AA", zh: "选定一种氨基酸" } as Bi, c: "text-flux-400" },
            ].map((m, i) => (
              <div key={i} className="rounded-lg border border-void-500/50 bg-void-900/50 py-2">
                <div className={`mono text-sm font-bold ${m.c}`}>{m.v}</div>
                <div className="mt-0.5 text-[0.62rem] leading-tight text-ghost-500">
                  <T v={m.l} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── transcription / translation stepper ── */}
      <div className="holo mt-5 rounded-2xl p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {steps.map((s, i) => {
            const on = step === i;
            return (
              <button
                key={s.tag}
                onClick={() => setStep(i)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[0.72rem] transition"
                style={{
                  color: on ? "#04070d" : "#5cf2cc",
                  background: on ? "#23e6b3" : "rgba(35,230,179,0.08)",
                  border: "1px solid rgba(35,230,179,0.3)",
                }}
                aria-pressed={on}
              >
                <span className="opacity-70">{i + 1}</span>
                {s.tag}
                {i < steps.length - 1 && <span className="text-ghost-500/60">›</span>}
              </button>
            );
          })}
        </div>
        <div key={step} className="lang-fade">
          <div className="display mb-1 text-sm text-ghost-50">
            <T v={steps[step].lab} />
          </div>
          <p className="text-sm leading-relaxed text-ghost-300">
            <T v={steps[step].body} />
          </p>
        </div>
      </div>

      {/* ── genome-scale readouts ── */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            big: "3.2 B",
            unit: { en: "base pairs", zh: "碱基对" } as Bi,
            sub: { en: "the human genome", zh: "人类基因组" } as Bi,
            c: "signal-text",
          },
          {
            big: "~750 MB",
            unit: { en: "raw 2-bit code", zh: "原始 2 比特编码" } as Bi,
            sub: { en: "fits on one disc", zh: "可装入一张光盘" } as Bi,
            c: "wire-text",
          },
          {
            big: "~20,000",
            unit: { en: "protein-coding genes", zh: "蛋白质编码基因" } as Bi,
            sub: { en: "in only ~1.5% of the DNA", zh: "仅占约 1.5% 的 DNA" } as Bi,
            c: "flux-text",
          },
          {
            big: "1 / 10⁹",
            unit: { en: "error rate", zh: "错误率" } as Bi,
            sub: { en: "after proofreading + repair", zh: "经校对与修复后" } as Bi,
            c: "pulse-text",
          },
        ].map((m, i) => (
          <div key={i} className="holo rounded-xl p-3.5">
            <div className={`display text-2xl leading-none ${m.c}`}>{m.big}</div>
            <div className="mono mt-1.5 text-xs text-ghost-200">
              <T v={m.unit} />
            </div>
            <div className="mt-0.5 text-[0.68rem] leading-tight text-ghost-500">
              <T v={m.sub} />
            </div>
          </div>
        ))}
      </div>

      <div className="my-5 h-px rule-sig" />
      <p className="mono text-center text-[0.72rem] text-ghost-500">
        <T
          v={{
            en: "A 2-bit alphabet, 6-bit words, a 64→20 redundant code, and a copy machine accurate to one part in a billion — biology solved information storage and error correction billions of years before Shannon named them.",
            zh: "2 比特的字母表、6 比特的词、一套 64→20 的冗余编码，以及精确到十亿分之一的复制机器——早在香农为它们命名的数十亿年前，生物学就已解决了信息存储与纠错问题。",
          }}
        />
      </p>
    </div>
  );
}
