"use client";

import { useState, useMemo } from "react";
import { useLang, T, type Bi } from "./lang";

type Era = "signal" | "flux" | "wire" | "pulse";

type Node = {
  id: string;
  name: Bi;
  era: Era;
  year: Bi; // human-readable date
  x: number; // 0..100 (along timeline)
  y: number; // 0..100 (vertical lane)
  parent: string[]; // ids of predecessors
  encodes: Bi;
  property: Bi;
  glyphs: string; // real unicode example
  symbolCount: number; // log10-ish slot for the compression view (relative)
  infoPerSymbol: number; // 0..100 information density per symbol
  flow?: boolean; // animate this incoming edge
};

const ERA_HEX: Record<Era, string> = {
  signal: "#5cf2cc",
  flux: "#ffc861",
  wire: "#67d8fb",
  pulse: "#ff79bf",
};
const ERA_DIM: Record<Era, string> = {
  signal: "rgba(35,230,179,0.5)",
  flux: "rgba(245,179,56,0.5)",
  wire: "rgba(47,198,245,0.5)",
  pulse: "rgba(255,77,166,0.5)",
};

/* Accurate writing-systems / notation history. x = timeline position, y = lane. */
const NODES: Node[] = [
  {
    id: "speech", name: { en: "Gesture & Speech", zh: "手势与口语" }, era: "signal",
    year: { en: "~100,000 BCE", zh: "约前 10 万年" }, x: 4, y: 50, parent: [],
    encodes: { en: "Spoken sound and bodily gesture — meaning with no persistent record.", zh: "口头声音与身体动作——有意义但不留持久记录。" },
    property: { en: "Volatile, real-time, ~44 phonemes recombined into unlimited speech.", zh: "易逝、实时，约 44 个音素重组为无限语句。" },
    glyphs: "🗣 〜", symbolCount: 5, infoPerSymbol: 30,
  },
  {
    id: "cave", name: { en: "Pictographs", zh: "图画文字" }, era: "signal",
    year: { en: "~40,000 BCE", zh: "约前 4 万年" }, x: 14, y: 28, parent: ["speech"],
    encodes: { en: "Cave art & picture-signs: a drawing stands for a thing or event.", zh: "洞穴艺术与图形符号：以图代物或代事。" },
    property: { en: "One picture ≈ one concept. No grammar, no sound mapping.", zh: "一图≈一概念。无语法，不映射读音。" },
    glyphs: "𓃿 𓅓 𓇳", symbolCount: 40, infoPerSymbol: 55,
  },
  {
    id: "cuneiform", name: { en: "Cuneiform", zh: "楔形文字" }, era: "flux",
    year: { en: "~3200 BCE", zh: "约前 3200 年" }, x: 26, y: 18, parent: ["cave"], flow: true,
    encodes: { en: "Sumerian wedge-marks on clay — first true writing, accounts & law.", zh: "苏美尔人在泥板上压出楔形——最早的真正文字，用于记账与律法。" },
    property: { en: "~600+ signs, mixed logographic & syllabic. Stylus on clay.", zh: "600 多个符号，意符与音节混用。芦苇笔压泥板。" },
    glyphs: "𒀀 𒈾 𒂗", symbolCount: 600, infoPerSymbol: 70,
  },
  {
    id: "logograph", name: { en: "Logographs 汉字", zh: "汉字（表意文字）" }, era: "flux",
    year: { en: "~1200 BCE", zh: "约前 1200 年" }, x: 38, y: 40, parent: ["cuneiform", "cave"],
    encodes: { en: "Chinese characters: each glyph carries a whole morpheme of meaning.", zh: "汉字：每个字形承载一个完整的意义语素。" },
    property: { en: "Thousands of logographs, dense per-symbol meaning, sound-independent.", zh: "数千个表意字，单字信息密度高，与读音无关。" },
    glyphs: "信息 文字", symbolCount: 50000, infoPerSymbol: 96,
  },
  {
    id: "syllabary", name: { en: "Syllabaries", zh: "音节文字" }, era: "wire",
    year: { en: "~1700 BCE", zh: "约前 1700 年" }, x: 40, y: 66, parent: ["cuneiform"],
    encodes: { en: "One sign per consonant-vowel syllable (e.g. かな, Linear B).", zh: "每个符号对应一个辅元音节（如假名、线形文字 B）。" },
    property: { en: "~50–90 signs. Phonetic, but bound to one language's sounds.", zh: "约 50–90 个符号。表音，但绑定特定语言的发音。" },
    glyphs: "あ か さ", symbolCount: 80, infoPerSymbol: 50,
  },
  {
    id: "phoenician", name: { en: "Phoenician", zh: "腓尼基字母" }, era: "wire",
    year: { en: "~1050 BCE", zh: "约前 1050 年" }, x: 50, y: 80, parent: ["syllabary"], flow: true,
    encodes: { en: "First alphabet: ~22 consonant signs, traded across the Mediterranean.", zh: "首个字母表：约 22 个辅音符号，随地中海贸易传播。" },
    property: { en: "Abjad — consonants only, vowels inferred. Ancestor of most alphabets.", zh: "辅音文字——仅记辅音，元音推断。多数字母表之祖。" },
    glyphs: "𐤀 𐤁 𐤂", symbolCount: 22, infoPerSymbol: 24,
  },
  {
    id: "greek", name: { en: "Greek Alphabet", zh: "希腊字母" }, era: "wire",
    year: { en: "~800 BCE", zh: "约前 800 年" }, x: 60, y: 70, parent: ["phoenician"],
    encodes: { en: "Phoenician + explicit vowels — the first full alphabet.", zh: "腓尼基字母 + 明确元音——首个完整字母表。" },
    property: { en: "24 letters, both consonants & vowels. Fully phonetic.", zh: "24 个字母，辅音与元音兼备。完全表音。" },
    glyphs: "Α Β Γ Δ", symbolCount: 24, infoPerSymbol: 22,
  },
  {
    id: "latin", name: { en: "Latin Alphabet", zh: "拉丁字母" }, era: "wire",
    year: { en: "~700 BCE", zh: "约前 700 年" }, x: 70, y: 82, parent: ["greek"],
    encodes: { en: "~26 phonetic letters — the world's most-used writing system.", zh: "约 26 个表音字母——全球使用最广的书写系统。" },
    property: { en: "Few symbols, low per-symbol info, extremely composable.", zh: "符号少，单字信息低，组合性极强。" },
    glyphs: "A B C i", symbolCount: 26, infoPerSymbol: 20,
  },
  {
    id: "numerals", name: { en: "Hindu–Arabic Numerals", zh: "印度-阿拉伯数字" }, era: "flux",
    year: { en: "~600 CE", zh: "约 600 年" }, x: 64, y: 50, parent: ["logograph"],
    encodes: { en: "Positional digits 0–9 with a true zero — quantity made compact.", zh: "带真正零的位值数字 0–9——使数量表达极度紧凑。" },
    property: { en: "10 symbols + place value encode any number. Enabled arithmetic.", zh: "10 个符号 + 位值可表任意数。开启了算术。" },
    glyphs: "0 1 2 9", symbolCount: 10, infoPerSymbol: 35,
  },
  {
    id: "math", name: { en: "Mathematical Notation", zh: "数学符号" }, era: "flux",
    year: { en: "~1600 CE", zh: "约 1600 年" }, x: 76, y: 36, parent: ["numerals"], flow: true,
    encodes: { en: "Operators, variables & quantifiers — relations between quantities.", zh: "运算符、变量与量词——量与量之间的关系。" },
    property: { en: "Compact, unambiguous, language-independent. e.g. ∑ ∫ √ ∞.", zh: "紧凑、无歧义、跨语言。如 ∑ ∫ √ ∞。" },
    glyphs: "∑ ∫ √ π", symbolCount: 200, infoPerSymbol: 78,
  },
  {
    id: "logic", name: { en: "Formal Logic", zh: "形式逻辑" }, era: "pulse",
    year: { en: "~1879 CE", zh: "约 1879 年" }, x: 82, y: 24, parent: ["math"],
    encodes: { en: "Truth, inference & proof as manipulable symbols (Frege, Boole).", zh: "把真值、推理与证明化为可操作的符号（弗雷格、布尔）。" },
    property: { en: "∧ ∨ ¬ → ∀ ∃ — meaning becomes mechanical, machine-checkable.", zh: "∧ ∨ ¬ → ∀ ∃——意义变得机械、可被机器验证。" },
    glyphs: "∀ ∃ ∧ ¬", symbolCount: 30, infoPerSymbol: 82,
  },
  {
    id: "binary", name: { en: "Binary / Code", zh: "二进制 / 代码" }, era: "signal",
    year: { en: "~1948 CE", zh: "约 1948 年" }, x: 86, y: 58, parent: ["logic", "math"], flow: true,
    encodes: { en: "Everything — text, image, sound — reduced to the bit, 0/1.", zh: "万物——文字、图像、声音——皆约化为比特 0/1。" },
    property: { en: "2 symbols, infinitely composable. The universal substrate.", zh: "2 个符号，无限可组合。通用的底层基质。" },
    glyphs: "01001001", symbolCount: 2, infoPerSymbol: 10,
  },
  {
    id: "emoji", name: { en: "Emoji", zh: "表情符号" }, era: "pulse",
    year: { en: "~1999 CE", zh: "约 1999 年" }, x: 88, y: 78, parent: ["latin", "cave"],
    encodes: { en: "Tone, emotion & ideas as pictographs — pictographs return, digital.", zh: "用图形表达语气、情绪与概念——图画文字在数字时代回归。" },
    property: { en: "~3,800 glyphs in Unicode. Dense affect, language-neutral.", zh: "Unicode 中约 3800 个字形。情感密度高，跨语言。" },
    glyphs: "😀 🔥 💡 🌐", symbolCount: 3800, infoPerSymbol: 60,
  },
  {
    id: "tokens", name: { en: "AI Tokens / Embeddings", zh: "AI 词元 / 嵌入向量" }, era: "pulse",
    year: { en: "~2017 CE", zh: "约 2017 年" }, x: 95, y: 46, parent: ["binary", "logic", "emoji"], flow: true,
    encodes: { en: "Meaning as high-dimensional vectors — geometry of concepts.", zh: "把意义编码为高维向量——概念的几何结构。" },
    property: { en: "~100k token vocab, each a vector in 1000s of dims. Learned, continuous.", zh: "约 10 万词元，每个为千维向量。习得的、连续的。" },
    glyphs: "[0.21,−0.7,…]", symbolCount: 100000, infoPerSymbol: 99,
  },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

/* relative symbol-count for bar scaling: log10 normalised */
function symScale(count: number): number {
  return Math.min(100, (Math.log10(count) / Math.log10(100000)) * 100);
}

export default function SymbolTree() {
  const { lang } = useLang();
  const [view, setView] = useState<"tree" | "compression">("tree");
  const [selected, setSelected] = useState<string>("logograph");
  const sel = NODE_BY_ID[selected];

  // edges derived from parent relationships
  const edges = useMemo(
    () =>
      NODES.flatMap((n) =>
        n.parent.map((p) => ({ from: NODE_BY_ID[p], to: n, flow: !!n.flow }))
      ),
    []
  );

  return (
    <div className="w-full">
      {/* view toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="label-mono">
          {lang === "zh" ? "符号系统的演化" : "Evolution of Symbol Systems"}
        </span>
        <div className="flex overflow-hidden rounded-full border border-signal-500/30 font-mono text-[0.7rem]">
          {(["tree", "compression"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 transition ${
                view === v ? "bg-signal-500/20 text-signal-300" : "text-ghost-500 hover:text-signal-400"
              }`}
            >
              {v === "tree"
                ? lang === "zh" ? "谱系树" : "Tree"
                : lang === "zh" ? "压缩权衡" : "Compression"}
            </button>
          ))}
        </div>
      </div>

      {view === "tree" ? (
        <div className="holo rounded-xl p-3 sm:p-4">
          <div className="relative w-full overflow-x-auto">
            <svg viewBox="0 0 100 90" className="h-[340px] w-full min-w-[640px] sm:h-[420px]" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5cf2cc" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#5cf2cc" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* faint era timeline axis */}
              <line x1="2" y1="88" x2="98" y2="88" stroke="rgba(146,163,158,0.18)" strokeWidth="0.2" />

              {/* edges */}
              {edges.map((e, i) => {
                const active = e.from.id === selected || e.to.id === selected;
                const stroke = active ? ERA_HEX[e.to.era] : ERA_DIM[e.to.era];
                const mx = (e.from.x + e.to.x) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${e.from.x} ${e.from.y} C ${mx} ${e.from.y}, ${mx} ${e.to.y}, ${e.to.x} ${e.to.y}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={active ? 0.55 : 0.3}
                    opacity={active ? 0.95 : 0.45}
                    className={e.flow ? "flow" : undefined}
                    style={{ transition: "stroke 0.35s, opacity 0.35s, stroke-width 0.35s" }}
                  />
                );
              })}

              {/* nodes */}
              {NODES.map((n) => {
                const isSel = n.id === selected;
                const r = isSel ? 2.4 : 1.7;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x} ${n.y})`}
                    onClick={() => setSelected(n.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {isSel && <circle r={6} fill="url(#nodeGlow)" />}
                    <circle
                      r={r}
                      fill={isSel ? ERA_HEX[n.era] : "#070c15"}
                      stroke={ERA_HEX[n.era]}
                      strokeWidth={0.4}
                      className={isSel ? "glow-pulse" : undefined}
                      style={{ transition: "r 0.3s, fill 0.3s" }}
                    />
                    <text
                      x={0}
                      y={n.y > 70 ? 4.6 : -3}
                      textAnchor="middle"
                      fontSize="2.1"
                      fill={isSel ? ERA_HEX[n.era] : "rgba(189,203,199,0.78)"}
                      className={lang === "zh" ? "zh" : "mono"}
                      style={{ pointerEvents: "none", fontWeight: isSel ? 700 : 400 }}
                    >
                      {n.name[lang]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-1 text-center font-mono text-[0.62rem] text-ghost-500">
            {lang === "zh" ? "← 早期            点击任意节点查看详情            晚近 →" : "← earlier            click any node            later →"}
          </p>
        </div>
      ) : (
        <CompressionView lang={lang} selected={selected} setSelected={setSelected} />
      )}

      {/* detail card */}
      <div key={selected + lang} className="holo lang-fade mt-4 rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="display text-lg" style={{ color: ERA_HEX[sel.era] }}>
            <span className={lang === "zh" ? "zh" : ""}>{sel.name[lang]}</span>
          </h4>
          <span className="label-mono">{sel.year[lang]}</span>
        </div>
        <div className="my-3 h-px rule-sig" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="label-mono mb-1">{lang === "zh" ? "编码什么" : "What it encodes"}</div>
            <p className="text-sm leading-relaxed text-ghost-200">
              <span className={lang === "zh" ? "zh" : ""}>{sel.encodes[lang]}</span>
            </p>
          </div>
          <div>
            <div className="label-mono mb-1">{lang === "zh" ? "关键特性" : "Key property"}</div>
            <p className="text-sm leading-relaxed text-ghost-200">
              <span className={lang === "zh" ? "zh" : ""}>{sel.property[lang]}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="label-mono mb-1">{lang === "zh" ? "示例字形" : "Example glyphs"}</div>
            <div className="mono text-2xl tracking-wide" style={{ color: ERA_HEX[sel.era], textShadow: `0 0 18px ${ERA_DIM[sel.era]}` }}>
              {sel.glyphs}
            </div>
          </div>
          <div className="ml-auto flex gap-4 text-center">
            <div>
              <div className="mono text-lg text-wire-400">{sel.symbolCount.toLocaleString()}</div>
              <div className="label-mono">{lang === "zh" ? "符号数" : "symbols"}</div>
            </div>
            <div>
              <div className="mono text-lg text-flux-400">{sel.infoPerSymbol}<span className="text-sm">%</span></div>
              <div className="label-mono">{lang === "zh" ? "单符信息" : "info/sym"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompressionView({
  lang,
  selected,
  setSelected,
}: {
  lang: "en" | "zh";
  selected: string;
  setSelected: (id: string) => void;
}) {
  // sort by symbol count for a legible spread of the tradeoff
  const ordered = [...NODES].sort((a, b) => a.symbolCount - b.symbolCount);
  return (
    <div className="holo rounded-xl p-4 sm:p-5">
      <p className="mb-4 font-mono text-[0.7rem] leading-relaxed text-ghost-300">
        <T
          v={{
            en: "The fundamental tradeoff: few symbols (binary, alphabet) → low information per symbol but high composability. Many symbols (logographs, tokens) → dense meaning per symbol but a heavier system to learn.",
            zh: "根本权衡：符号少（二进制、字母）→ 单符信息低但组合性强；符号多（汉字、词元）→ 单符意义密集但系统更难习得。",
          }}
        />
      </p>
      <div className="space-y-2.5">
        {ordered.map((n) => {
          const isSel = n.id === selected;
          return (
            <button
              key={n.id}
              onClick={() => setSelected(n.id)}
              className={`block w-full rounded-lg border p-2.5 text-left transition ${
                isSel ? "border-signal-500/50 bg-signal-500/10" : "border-ghost-700/60 hover:border-signal-500/30"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-[0.8rem] ${isSel ? "text-signal-300" : "text-ghost-200"} ${lang === "zh" ? "zh" : ""}`}>
                  {n.name[lang]}
                </span>
                <span className="mono text-[0.62rem] text-ghost-500">
                  {n.symbolCount.toLocaleString()} {lang === "zh" ? "符号" : "sym"}
                </span>
              </div>
              {/* dual bars: symbol-count (wire) vs info-per-symbol (flux) */}
              <div className="space-y-1">
                <Track label={lang === "zh" ? "符号数量" : "symbol count"} pct={symScale(n.symbolCount)} hex="#67d8fb" />
                <Track label={lang === "zh" ? "单符信息" : "info / symbol"} pct={n.infoPerSymbol} hex="#ffc861" />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 font-mono text-[0.62rem]">
        <span className="text-wire-400">▮ {lang === "zh" ? "符号数量（log）" : "symbol count (log)"}</span>
        <span className="text-flux-400">▮ {lang === "zh" ? "每符号信息" : "information per symbol"}</span>
      </div>
    </div>
  );
}

function Track({ label, pct, hex }: { label: string; pct: number; hex: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono w-20 shrink-0 text-right text-[0.55rem] text-ghost-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-void-950/70">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${Math.max(2, pct)}%`, background: hex, boxShadow: `0 0 10px -1px ${hex}` }}
        />
      </div>
    </div>
  );
}
