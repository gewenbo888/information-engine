"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, T, type Bi } from "./lang";

/* ------------------------------------------------------------------ *
 * AI & INFORMATION COMPRESSION
 * An embedding compresses meaning into a position. Nearness = relatedness.
 * Hand-authored 2D layout in a 0..100 coordinate plane; clusters are
 * separated by construction so the geometry reads at a glance.
 * ------------------------------------------------------------------ */

type Cluster = "animals" | "royalty" | "numbers" | "emotions" | "tech" | "colors" | "food" | "places" | "time";

type Word = { en: string; zh: string; x: number; y: number; c: Cluster };

/* accent family per cluster — signal / wire / flux / pulse */
const CL: Record<Cluster, { stroke: string; glow: string; label: Bi }> = {
  animals: { stroke: "#5cf2cc", glow: "rgba(35,230,179,0.55)", label: { en: "animals", zh: "动物" } },
  royalty: { stroke: "#ffc861", glow: "rgba(245,179,56,0.55)", label: { en: "people / royalty", zh: "人物 / 王室" } },
  numbers: { stroke: "#67d8fb", glow: "rgba(47,198,245,0.55)", label: { en: "numbers", zh: "数字" } },
  emotions: { stroke: "#ff79bf", glow: "rgba(255,77,166,0.55)", label: { en: "emotions", zh: "情感" } },
  tech: { stroke: "#9af9e1", glow: "rgba(154,249,225,0.5)", label: { en: "technology", zh: "技术" } },
  colors: { stroke: "#ffaad6", glow: "rgba(255,170,214,0.5)", label: { en: "colors", zh: "颜色" } },
  food: { stroke: "#ffdc9a", glow: "rgba(255,220,154,0.5)", label: { en: "food", zh: "食物" } },
  places: { stroke: "#a6e9fd", glow: "rgba(166,233,253,0.5)", label: { en: "places", zh: "地点" } },
  time: { stroke: "#90a39e", glow: "rgba(144,163,158,0.45)", label: { en: "time", zh: "时间" } },
};

/* Layout: each cluster occupies a separated region of the 100x100 plane.
 * royalty points are placed so king−man+woman lands near queen,
 * and places so Paris−France+Italy lands near Rome. */
const WORDS: Word[] = [
  // animals — lower-left
  { en: "dog", zh: "狗", x: 13, y: 74, c: "animals" },
  { en: "cat", zh: "猫", x: 19, y: 80, c: "animals" },
  { en: "wolf", zh: "狼", x: 9, y: 67, c: "animals" },
  { en: "lion", zh: "狮子", x: 22, y: 70, c: "animals" },
  { en: "horse", zh: "马", x: 16, y: 87, c: "animals" },
  { en: "fish", zh: "鱼", x: 26, y: 84, c: "animals" },
  { en: "bird", zh: "鸟", x: 11, y: 81, c: "animals" },

  // royalty / people — upper-left (placed for analogy)
  { en: "king", zh: "国王", x: 24, y: 20, c: "royalty" },
  { en: "queen", zh: "女王", x: 35, y: 22, c: "royalty" },
  { en: "man", zh: "男人", x: 20, y: 33, c: "royalty" },
  { en: "woman", zh: "女人", x: 31, y: 35, c: "royalty" },
  { en: "prince", zh: "王子", x: 17, y: 14, c: "royalty" },
  { en: "princess", zh: "公主", x: 28, y: 12, c: "royalty" },
  { en: "child", zh: "孩子", x: 26, y: 42, c: "royalty" },

  // numbers — top center
  { en: "one", zh: "一", x: 47, y: 9, c: "numbers" },
  { en: "two", zh: "二", x: 52, y: 13, c: "numbers" },
  { en: "three", zh: "三", x: 57, y: 8, c: "numbers" },
  { en: "seven", zh: "七", x: 50, y: 19, c: "numbers" },
  { en: "ten", zh: "十", x: 60, y: 16, c: "numbers" },
  { en: "hundred", zh: "百", x: 55, y: 23, c: "numbers" },

  // emotions — right
  { en: "joy", zh: "喜悦", x: 84, y: 28, c: "emotions" },
  { en: "fear", zh: "恐惧", x: 90, y: 36, c: "emotions" },
  { en: "anger", zh: "愤怒", x: 87, y: 43, c: "emotions" },
  { en: "love", zh: "爱", x: 80, y: 34, c: "emotions" },
  { en: "sorrow", zh: "悲伤", x: 92, y: 27, c: "emotions" },
  { en: "hope", zh: "希望", x: 82, y: 22, c: "emotions" },

  // technology — center
  { en: "computer", zh: "计算机", x: 49, y: 50, c: "tech" },
  { en: "network", zh: "网络", x: 56, y: 46, c: "tech" },
  { en: "code", zh: "代码", x: 43, y: 45, c: "tech" },
  { en: "data", zh: "数据", x: 53, y: 56, c: "tech" },
  { en: "model", zh: "模型", x: 46, y: 58, c: "tech" },
  { en: "signal", zh: "信号", x: 59, y: 53, c: "tech" },

  // colors — center-right
  { en: "red", zh: "红", x: 70, y: 58, c: "colors" },
  { en: "blue", zh: "蓝", x: 76, y: 53, c: "colors" },
  { en: "green", zh: "绿", x: 73, y: 64, c: "colors" },
  { en: "gold", zh: "金", x: 79, y: 61, c: "colors" },
  { en: "violet", zh: "紫", x: 68, y: 51, c: "colors" },

  // food — bottom center
  { en: "bread", zh: "面包", x: 47, y: 80, c: "food" },
  { en: "rice", zh: "米饭", x: 53, y: 86, c: "food" },
  { en: "apple", zh: "苹果", x: 41, y: 84, c: "food" },
  { en: "tea", zh: "茶", x: 58, y: 78, c: "food" },
  { en: "wine", zh: "酒", x: 50, y: 91, c: "food" },

  // places — bottom-right (placed for Paris−France+Italy≈Rome)
  { en: "Paris", zh: "巴黎", x: 76, y: 80, c: "places" },
  { en: "France", zh: "法国", x: 70, y: 88, c: "places" },
  { en: "Italy", zh: "意大利", x: 88, y: 90, c: "places" },
  { en: "Rome", zh: "罗马", x: 94, y: 82, c: "places" },
  { en: "Japan", zh: "日本", x: 82, y: 72, c: "places" },
  { en: "Tokyo", zh: "东京", x: 90, y: 70, c: "places" },

  // time — far left mid
  { en: "past", zh: "过去", x: 6, y: 46, c: "time" },
  { en: "now", zh: "现在", x: 11, y: 52, c: "time" },
  { en: "future", zh: "未来", x: 5, y: 58, c: "time" },
];

const idx = (en: string) => WORDS.findIndex((w) => w.en === en);

/* preset vector analogies: a − b + c ≈ target */
type Analogy = { a: string; b: string; c: string; target: string; label: Bi };
const ANALOGIES: Analogy[] = [
  { a: "king", b: "man", c: "woman", target: "queen", label: { en: "king − man + woman", zh: "国王 − 男人 + 女人" } },
  { a: "Paris", b: "France", c: "Italy", target: "Rome", label: { en: "Paris − France + Italy", zh: "巴黎 − 法国 + 意大利" } },
  { a: "prince", b: "man", c: "woman", target: "princess", label: { en: "prince − man + woman", zh: "王子 − 男人 + 女人" } },
];

function dist(a: Word, b: Word) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function EmbeddingSpace() {
  const { lang } = useLang();
  const [selected, setSelected] = useState<number | null>(idx("king"));
  const [hover, setHover] = useState<number | null>(null);

  // vector-arithmetic animation
  const [anaIdx, setAnaIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 along the path
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // nearest neighbours of the selected word
  const neighbours = useMemo(() => {
    if (selected === null) return [];
    const self = WORDS[selected];
    const maxD = Math.hypot(100, 100);
    return WORDS.map((w, i) => ({ i, w, d: dist(self, w) }))
      .filter((o) => o.i !== selected)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map((o) => ({ ...o, sim: 1 - o.d / maxD }));
  }, [selected]);

  const neighbourSet = useMemo(() => new Set(neighbours.map((n) => n.i)), [neighbours]);

  // analogy geometry: result point = a − b + c
  const ana = ANALOGIES[anaIdx];
  const pA = WORDS[idx(ana.a)];
  const pB = WORDS[idx(ana.b)];
  const pC = WORDS[idx(ana.c)];
  const pT = WORDS[idx(ana.target)];
  const result = { x: pA.x - pB.x + pC.x, y: pA.y - pB.y + pC.y };

  // animated marker walks: a → (a−b) → (a−b+c)
  const stop1 = { x: pA.x - pB.x, y: pA.y - pB.y }; // intermediate (after subtracting b)
  const marker = useMemo(() => {
    // two-segment path: A → A+(−b) ... but visually we show start=A, mid=A−b shifted to live area is abstract;
    // we instead animate along straight line A → result for legibility, with a midpoint pause feel.
    const x = pA.x + (result.x - pA.x) * progress;
    const y = pA.y + (result.y - pA.y) * progress;
    return { x, y };
  }, [pA.x, pA.y, result.x, result.y, progress]);

  function runAnalogy(i: number) {
    setAnaIdx(i);
    setSelected(null);
    setProgress(0);
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;
    let start: number | null = null;
    const DUR = 2200;
    function step(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / DUR);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setPlaying(false);
        // snap selection to the target so neighbours render
        setSelected(idx(ANALOGIES[anaIdxRef.current].target));
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // keep a ref of anaIdx for the rAF closure
  const anaIdxRef = useRef(anaIdx);
  anaIdxRef.current = anaIdx;

  const showAnalogy = playing || progress > 0;

  return (
    <div className="w-full">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* ---- the embedding plane ---- */}
        <div className="holo relative overflow-hidden rounded-xl p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="label-mono">{lang === "zh" ? "嵌入空间 · 二维投影" : "Embedding Space · 2D Projection"}</span>
            <span className="mono text-[0.62rem] text-ghost-500">
              {WORDS.length} {lang === "zh" ? "词元" : "tokens"}
            </span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg border border-signal-500/10 bg-void-950/60 dot-bg">
            <svg viewBox="0 0 100 100" className="block w-full" style={{ aspectRatio: "1 / 1" }}>
              {/* faint axes */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(92,242,204,0.07)" strokeWidth="0.2" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(92,242,204,0.07)" strokeWidth="0.2" />

              {/* neighbour links from the selected word */}
              {selected !== null &&
                !showAnalogy &&
                neighbours.map((n) => (
                  <line
                    key={`nl-${n.i}`}
                    x1={WORDS[selected].x}
                    y1={WORDS[selected].y}
                    x2={n.w.x}
                    y2={n.w.y}
                    stroke={CL[WORDS[selected].c].stroke}
                    strokeWidth={0.35}
                    opacity={0.32 + n.sim * 0.4}
                    className="flow"
                    strokeDasharray="1.2 1.6"
                  />
                ))}

              {/* analogy vectors: A→result and parallel guide b→c reference */}
              {showAnalogy && (
                <g>
                  {/* reference vector b → a (the "−b" direction) shown faintly */}
                  <line x1={pB.x} y1={pB.y} x2={pA.x} y2={pA.y} stroke="#90a39e" strokeWidth={0.3} opacity={0.4} strokeDasharray="1 1.5" />
                  {/* parallel vector c → result, the analogy is "same offset" */}
                  <line x1={pC.x} y1={pC.y} x2={result.x} y2={result.y} stroke="#67d8fb" strokeWidth={0.4} opacity={0.65} strokeDasharray="1.4 1.4" />
                  {/* main animated arrow A → result */}
                  <line
                    x1={pA.x}
                    y1={pA.y}
                    x2={marker.x}
                    y2={marker.y}
                    stroke="#ffc861"
                    strokeWidth={0.6}
                    opacity={0.95}
                  />
                  {/* target ring */}
                  <circle cx={pT.x} cy={pT.y} r={4} fill="none" stroke="#23e6b3" strokeWidth={0.5} opacity={0.7} className="glow-pulse" />
                  {/* moving marker */}
                  <circle cx={marker.x} cy={marker.y} r={1.5} fill="#ffc861" opacity={0.95}>
                  </circle>
                  <circle cx={marker.x} cy={marker.y} r={3} fill="none" stroke="#ffc861" strokeWidth={0.4} opacity={0.5} />
                </g>
              )}

              {/* word points */}
              {WORDS.map((w, i) => {
                const isSel = selected === i;
                const isNbr = neighbourSet.has(i) && !showAnalogy;
                const isHover = hover === i;
                const fam = CL[w.c];
                const dim = (selected !== null && !showAnalogy && !isSel && !isNbr) || (showAnalogy && i !== idx(ana.a) && i !== idx(ana.b) && i !== idx(ana.c) && i !== idx(ana.target));
                const r = isSel ? 1.7 : isHover ? 1.5 : 1.1;
                return (
                  <g
                    key={w.en}
                    onClick={() => {
                      setSelected(i);
                      setProgress(0);
                    }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer", transition: "opacity 0.35s" }}
                    opacity={dim ? 0.22 : 1}
                  >
                    {(isSel || isHover) && (
                      <circle cx={w.x} cy={w.y} r={r + 2.4} fill={fam.glow} opacity={0.5} />
                    )}
                    <circle cx={w.x} cy={w.y} r={r} fill={fam.stroke} />
                    <text
                      x={w.x}
                      y={w.y - 2.4}
                      textAnchor="middle"
                      fontSize={isSel || isHover ? 2.7 : 2.1}
                      fontFamily='"IBM Plex Mono", monospace'
                      fill={isSel || isHover ? "#eef5f3" : "rgba(221,233,230,0.62)"}
                      style={{ pointerEvents: "none" }}
                    >
                      {lang === "zh" ? w.zh : w.en}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* corner axis hints */}
            <div className="pointer-events-none absolute bottom-1 right-2 font-mono text-[0.55rem] text-ghost-700">dim 1 →</div>
            <div className="pointer-events-none absolute left-1 top-2 font-mono text-[0.55rem] text-ghost-700">↑ dim 2</div>
          </div>

          {/* cluster legend */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {(Object.keys(CL) as Cluster[]).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 font-mono text-[0.58rem] text-ghost-300">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: CL[c].stroke }} />
                <T v={CL[c].label} />
              </span>
            ))}
          </div>
        </div>

        {/* ---- side panel: readouts + arithmetic ---- */}
        <div className="flex flex-col gap-4">
          {/* nearest neighbours */}
          <div className="holo rounded-xl p-4">
            <span className="label-mono">{lang === "zh" ? "最近邻 · 相似度" : "Nearest neighbours · similarity"}</span>
            {selected !== null && !showAnalogy ? (
              <>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="display text-lg" style={{ color: CL[WORDS[selected].c].stroke }}>
                    {lang === "zh" ? WORDS[selected].zh : WORDS[selected].en}
                  </span>
                  <span className="mono text-[0.62rem] text-ghost-500">
                    ({WORDS[selected].x.toFixed(0)}, {WORDS[selected].y.toFixed(0)})
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {neighbours.map((n) => (
                    <button
                      key={n.i}
                      onClick={() => setSelected(n.i)}
                      className="group flex w-full items-center gap-2 text-left"
                    >
                      <span className="w-16 shrink-0 truncate font-mono text-[0.72rem] text-ghost-200 group-hover:text-signal-300">
                        {lang === "zh" ? n.w.zh : n.w.en}
                      </span>
                      <span className="relative h-2 flex-1 overflow-hidden rounded bg-void-950/70 ring-1 ring-inset ring-ghost-700/50">
                        <span
                          className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                          style={{
                            width: `${n.sim * 100}%`,
                            background: "linear-gradient(90deg,#0fbf95,#5cf2cc)",
                            boxShadow: "0 0 10px -2px rgba(35,230,179,0.6)",
                          }}
                        />
                      </span>
                      <span className="w-10 shrink-0 text-right font-mono text-[0.66rem] text-signal-300">
                        {(n.sim * 100).toFixed(1)}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[0.6rem] leading-snug text-ghost-500">
                  {lang === "zh"
                    ? "// 相似度 = 1 − 归一化距离。点击词元探索。"
                    : "// similarity = 1 − normalised distance. click any token to explore."}
                </p>
              </>
            ) : (
              <p className="mt-3 font-mono text-[0.7rem] leading-relaxed text-ghost-300">
                {showAnalogy
                  ? lang === "zh"
                    ? "向量运算进行中——观察箭头落点。"
                    : "vector operation in flight — watch where the arrow lands."
                  : lang === "zh"
                  ? "点击空间中任意词元。"
                  : "click any token in the space."}
              </p>
            )}
          </div>

          {/* vector arithmetic */}
          <div className="holo rounded-xl p-4">
            <span className="label-mono">{lang === "zh" ? "向量算术 · 类比" : "Vector arithmetic · analogy"}</span>
            <div className="mt-3 space-y-2">
              {ANALOGIES.map((a, i) => (
                <button
                  key={i}
                  onClick={() => runAnalogy(i)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono text-[0.74rem] transition ${
                    anaIdx === i && showAnalogy
                      ? "border-flux-500/50 bg-flux-500/10 text-flux-400"
                      : "border-ghost-700 text-ghost-300 hover:border-flux-500/30 hover:text-flux-400"
                  }`}
                >
                  <span>
                    <T v={a.label} /> <span className="text-ghost-500">≈ ?</span>
                  </span>
                  <span className="text-ghost-500">▶</span>
                </button>
              ))}
            </div>
            {showAnalogy && (
              <div className="mt-3 rounded-lg border border-signal-500/20 bg-void-950/50 p-3">
                <div className="font-mono text-[0.72rem] text-ghost-200">
                  <span className="flux-text">{lang === "zh" ? WORDS[idx(ana.a)].zh : ana.a}</span>{" − "}
                  <span className="text-ghost-300">{lang === "zh" ? WORDS[idx(ana.b)].zh : ana.b}</span>{" + "}
                  <span className="wire-text">{lang === "zh" ? WORDS[idx(ana.c)].zh : ana.c}</span>
                </div>
                <div className="mt-1 font-mono text-[0.8rem]">
                  <span className="text-ghost-500">≈ </span>
                  <span className="signal-text display">
                    {progress >= 1 ? (lang === "zh" ? WORDS[idx(ana.target)].zh : ana.target) : "···"}
                  </span>
                  {progress >= 1 && (
                    <span className="ml-2 mono text-[0.62rem] text-ghost-500">
                      {lang === "zh" ? "落在目标附近" : "lands near target"}
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded bg-void-950">
                  <div
                    className="h-full rounded bg-gradient-to-r from-flux-500 to-signal-500"
                    style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }}
                  />
                </div>
              </div>
            )}
            <p className="mt-3 font-mono text-[0.6rem] leading-snug text-ghost-500">
              {lang === "zh"
                ? "// 同样的几何偏移把性别、首都映射到另一个词。"
                : "// the same geometric offset maps gender, capital → another word."}
            </p>
          </div>
        </div>
      </div>

      {/* caption */}
      <div className="mt-4 holo rounded-xl p-4">
        <div className="h-px rule-sig" />
        <p className="mt-3 text-[0.82rem] leading-relaxed text-ghost-200">
          <T
            v={{
              en: "An embedding compresses meaning into a position. Trained only to predict the next token, models discover that nearness should encode relatedness — so directions in the space come to mean things (gender, plurality, capital-of). Prediction over such a geometry is itself a powerful form of compression: lossless of structure, lossy of detail.",
              zh: "嵌入把意义压缩成一个位置。仅以预测下一个词元为目标训练，模型便发现「邻近」应当编码「相关」——于是空间中的方向开始具有含义（性别、复数、首都）。在这样的几何上进行预测，本身就是一种强大的压缩：结构无损，细节有损。",
            }}
          />
        </p>
        <p className="mt-2 font-mono text-[0.64rem] text-wire-400">
          <T
            v={{
              en: "Bengio's neural language model (2003) → word2vec (2013) → transformers: meaning as geometry, learned from prediction alone.",
              zh: "Bengio 的神经语言模型（2003）→ word2vec（2013）→ Transformer：意义即几何，仅从预测中习得。",
            }}
          />
        </p>
      </div>
    </div>
  );
}
