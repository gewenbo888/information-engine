"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang, T, t, type Bi } from "./lang";

/* ---------- the ascending stack of information layers ---------- */
interface Layer {
  name: Bi;
  desc: Bi; // the information transform happening at this layer
  metric: Bi; // an escalating quantity, expressed in orders of magnitude
}

const LAYERS: Layer[] = [
  {
    name: { en: "Physics", zh: "物理" },
    desc: { en: "quantum states encode the first bits; entropy keeps the books", zh: "量子态编码最初的比特；熵记录账目" },
    metric: { en: "~10^0 bit / event", zh: "约 10^0 比特/事件" },
  },
  {
    name: { en: "Chemistry", zh: "化学" },
    desc: { en: "molecular bonds store configurations — matter that remembers", zh: "分子键存储构型——能够记忆的物质" },
    metric: { en: "~10^2 states / molecule", zh: "约 10^2 态/分子" },
  },
  {
    name: { en: "Biology · DNA", zh: "生物 · DNA" },
    desc: { en: "a 4-letter code self-replicates and error-corrects across aeons", zh: "四字母编码自我复制，跨越亿万年纠错" },
    metric: { en: "~10^9 base pairs / genome", zh: "约 10^9 碱基对/基因组" },
  },
  {
    name: { en: "Neural systems", zh: "神经系统" },
    desc: { en: "spikes compress sensation into models; memory is rewritten", zh: "脉冲将感觉压缩为模型；记忆被重写" },
    metric: { en: "~10^14 synapses / brain", zh: "约 10^14 突触/脑" },
  },
  {
    name: { en: "Language", zh: "语言" },
    desc: { en: "sound becomes symbol — minds transmit thought across the air", zh: "声音化为符号——头脑在空气中传递思想" },
    metric: { en: "~10^4 words / lexicon", zh: "约 10^4 词/词库" },
  },
  {
    name: { en: "Writing", zh: "文字" },
    desc: { en: "information escapes the body and outlives the speaker", zh: "信息脱离肉体，比说话者更长寿" },
    metric: { en: "~10^8 books written", zh: "约 10^8 部已写成的书" },
  },
  {
    name: { en: "Computation", zh: "计算" },
    desc: { en: "logic gates make symbols act on symbols — automated thought", zh: "逻辑门让符号作用于符号——自动化的思维" },
    metric: { en: "~10^18 FLOP / s", zh: "约 10^18 次浮点/秒" },
  },
  {
    name: { en: "Networks · Internet", zh: "网络 · 互联网" },
    desc: { en: "packets route the planet; every node speaks to every node", zh: "数据包贯通全球；每个节点与每个节点对话" },
    metric: { en: "~10^21 bytes / year", zh: "约 10^21 字节/年" },
  },
  {
    name: { en: "Economics · Cryptography", zh: "经济 · 密码学" },
    desc: { en: "trust is encoded; value moves as verifiable information", zh: "信任被编码；价值以可验证的信息流动" },
    metric: { en: "~10^15 USD settled / year", zh: "约 10^15 美元/年结算" },
  },
  {
    name: { en: "AI systems", zh: "人工智能" },
    desc: { en: "models compress civilization's text into predictive structure", zh: "模型将文明的全部文本压缩为预测结构" },
    metric: { en: "~10^12 parameters / model", zh: "约 10^12 参数/模型" },
  },
  {
    name: { en: "Collective intelligence", zh: "集体智能" },
    desc: { en: "humans + machines form one coupled inferential loop", zh: "人类与机器构成一个耦合的推理回路" },
    metric: { en: "~10^10 minds online", zh: "约 10^10 个在线心智" },
  },
  {
    name: { en: "Planetary cognition", zh: "行星认知" },
    desc: { en: "the biosphere + technosphere process Earth as one signal", zh: "生物圈与技术圈将地球作为一个信号处理" },
    metric: { en: "~10^25 bit / s throughput", zh: "约 10^25 比特/秒吞吐" },
  },
];

/* the recurring law printed in the legend */
const LAW: Bi = {
  en: "Each layer compresses, transmits, error-corrects and computes the layer below — then becomes substrate for the next.",
  zh: "每一层压缩、传输、纠错并计算其下一层——然后成为上一层的基底。",
};

type LineKind = "boot" | "layer" | "metric" | "close";
interface OutLine {
  kind: LineKind;
  text: string; // already-resolved string for current lang at print time
  bi?: Bi; // keep bilingual source for live re-render of completed lines
  accent: string; // tailwind text color class
  layerIdx?: number;
}

const ACCENTS = ["text-signal-300", "text-wire-400", "text-flux-400", "text-pulse-400"];

export default function RecursiveConsole() {
  const { lang } = useLang();
  const langRef = useRef(lang);
  langRef.current = lang;

  const [depth, setDepth] = useState(LAYERS.length);
  const [speed, setSpeed] = useState(1); // 0.4 .. 2.2 multiplier
  const [lines, setLines] = useState<OutLine[]>([]);
  const [typing, setTyping] = useState(""); // the line currently being typed
  const [typingAccent, setTypingAccent] = useState("text-signal-300");
  const [running, setRunning] = useState(false);
  const [doneIdx, setDoneIdx] = useState(-1); // last fully simulated layer

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // refs that drive the async typewriter loop
  const cancelRef = useRef(false);
  const cursorRef = useRef(0); // next layer index to print

  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms / Math.max(0.2, speedRef.current)));

  // autoscroll on new output
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, typing]);

  /* typewriter print of one string; commits it to `lines` when finished */
  const typeLine = useCallback(
    async (full: string, accent: string, commit: Omit<OutLine, "text">) => {
      setTypingAccent(accent);
      let buf = "";
      for (let i = 0; i < full.length; i++) {
        if (cancelRef.current) return;
        buf += full[i];
        setTyping(buf);
        // faster for spaces, slight jitter for life
        await sleep(full[i] === " " ? 6 : 16 + Math.random() * 14);
      }
      if (cancelRef.current) return;
      setLines((ls) => [...ls, { ...commit, text: full }]);
      setTyping("");
    },
    [] // sleep/refs are stable
  );

  /* render a single layer block (name line + metric line) */
  const printLayer = useCallback(
    async (idx: number) => {
      const L = LAYERS[idx];
      const lng = langRef.current;
      const accent = ACCENTS[idx % ACCENTS.length];
      const arrow = "↑".repeat(1);
      const namePart = t(L.name, lng);
      const descPart = t(L.desc, lng);
      const head: Bi = {
        en: `[${String(idx).padStart(2, "0")}] ${arrow} ${t(L.name, "en")} — ${t(L.desc, "en")}`,
        zh: `[${String(idx).padStart(2, "0")}] ${arrow} ${t(L.name, "zh")} — ${t(L.desc, "zh")}`,
      };
      await typeLine(`[${String(idx).padStart(2, "0")}] ${arrow} ${namePart} — ${descPart}`, accent, {
        kind: "layer",
        bi: head,
        accent,
        layerIdx: idx,
      });
      if (cancelRef.current) return;
      const metricBi: Bi = {
        en: `      ↳ recurse · throughput ${t(L.metric, "en")}`,
        zh: `      ↳ 递归 · 吞吐 ${t(L.metric, "zh")}`,
      };
      await typeLine(t(metricBi, lng), "text-ghost-500", { kind: "metric", bi: metricBi, accent: "text-ghost-500", layerIdx: idx });
      if (cancelRef.current) return;
      setDoneIdx(idx);
    },
    [typeLine]
  );

  /* run the full ascending simulation from the current cursor up to `depth` */
  const runFrom = useCallback(
    async (auto: boolean) => {
      cancelRef.current = false;
      setRunning(true);
      // boot line on a fresh run
      if (cursorRef.current === 0 && lines.length === 0) {
        const boot: Bi = {
          en: "$ simulate --information-stack --recursive  ▷ booting…",
          zh: "$ simulate --information-stack --recursive  ▷ 启动中…",
        };
        await typeLine(t(boot, langRef.current), "text-signal-400", { kind: "boot", bi: boot, accent: "text-signal-400" });
      }
      while (cursorRef.current < depth) {
        if (cancelRef.current) break;
        await printLayer(cursorRef.current);
        cursorRef.current += 1;
        if (!auto) break; // STEP: one layer then stop
        await sleep(120);
      }
      if (!cancelRef.current && cursorRef.current >= depth) {
        const close: Bi = {
          en: "» the same loop — compress, transmit, correct, compute — recurses at every scale. Is civilization becoming a single planetary-scale information organism?",
          zh: "» 同一个回路——压缩、传输、纠错、计算——在每个尺度上递归。文明正在成为单一的行星尺度信息有机体吗？",
        };
        await typeLine(t(close, langRef.current), "text-pulse-300", { kind: "close", bi: close, accent: "text-pulse-300" });
      }
      if (!auto) {
        // leave running=false so STEP can be pressed again
      }
      setRunning(false);
    },
    [depth, lines.length, printLayer, typeLine]
  );

  const onRun = () => {
    if (running) return;
    runFrom(true);
  };
  const onStep = () => {
    if (running) return;
    if (cursorRef.current >= depth) return;
    runFrom(false);
  };
  const onReset = () => {
    cancelRef.current = true;
    cursorRef.current = 0;
    setRunning(false);
    setLines([]);
    setTyping("");
    setDoneIdx(-1);
  };

  // stop the loop cleanly on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  // if depth is dragged below what we've printed, trim output
  useEffect(() => {
    if (cursorRef.current > depth && !running) {
      cursorRef.current = depth;
      setLines((ls) => ls.filter((l) => l.kind === "boot" || (l.layerIdx ?? -1) < depth));
      setDoneIdx((d) => Math.min(d, depth - 1));
    }
  }, [depth, running]);

  const progress = Math.round((Math.min(doneIdx + 1, depth) / depth) * 100);

  return (
    <div className="w-full">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* ---------------- terminal ---------------- */}
        <div className="holo overflow-hidden rounded-xl">
          {/* title bar */}
          <div className="flex items-center justify-between border-b border-signal-500/15 bg-void-950/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-pulse-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-flux-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal-500/70" />
              <span className="label-mono ml-2">information-stack.sim</span>
            </div>
            <span className="mono text-[0.6rem] text-ghost-500">
              {lang === "zh" ? "递归 · " : "recursion · "}
              <span className="text-signal-300">{Math.max(0, doneIdx + 1)}</span>/{depth}
            </span>
          </div>

          {/* output viewport */}
          <div className="relative bg-void-950/80 grid-bg">
            {/* scanline */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="scan h-1/3 w-full bg-gradient-to-b from-transparent via-signal-500/[0.06] to-transparent" />
            </div>
            <div
              ref={scrollRef}
              className="relative h-[360px] overflow-y-auto px-4 py-3 font-mono text-[0.74rem] leading-relaxed"
            >
              {lines.length === 0 && !typing && (
                <div className="text-ghost-500">
                  <span className="text-signal-400">$</span> {lang === "zh" ? "就绪。按 RUN 模拟信息的演化。" : "ready. press RUN to simulate the evolution of information."}
                  <span className="caret text-signal-400">▋</span>
                </div>
              )}
              {lines.map((l, i) => (
                <div key={i} className={`${l.accent} ${l.kind === "close" ? "mt-2 border-t border-pulse-500/20 pt-2" : ""}`}>
                  {l.bi ? <span className={lang === "zh" ? "zh" : ""}>{l.bi[lang]}</span> : l.text}
                </div>
              ))}
              {typing && (
                <div className={typingAccent}>
                  <span className={lang === "zh" ? "zh" : ""}>{typing}</span>
                  <span className="caret">▋</span>
                </div>
              )}
              {!typing && running && (
                <div className="text-signal-400">
                  <span className="caret">▋</span>
                </div>
              )}
            </div>
            {/* progress sliver */}
            <div className="h-0.5 w-full bg-void-800">
              <div
                className="h-full bg-gradient-to-r from-signal-500 via-wire-500 to-pulse-500 transition-all duration-500"
                style={{ width: `${progress}%`, boxShadow: "0 0 10px rgba(35,230,179,0.6)" }}
              />
            </div>
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-2 border-t border-signal-500/15 bg-void-950/40 px-4 py-3">
            <button
              onClick={onRun}
              disabled={running}
              className="rounded-md border border-signal-500/40 px-3 py-1.5 font-mono text-[0.72rem] text-signal-300 transition hover:bg-signal-500/15 disabled:opacity-40"
            >
              ▶ RUN
            </button>
            <button
              onClick={onStep}
              disabled={running}
              className="rounded-md border border-wire-500/40 px-3 py-1.5 font-mono text-[0.72rem] text-wire-400 transition hover:bg-wire-500/15 disabled:opacity-40"
            >
              ⏭ STEP
            </button>
            <button
              onClick={onReset}
              className="rounded-md border border-pulse-500/40 px-3 py-1.5 font-mono text-[0.72rem] text-pulse-300 transition hover:bg-pulse-500/15"
            >
              ⟲ RESET
            </button>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2 font-mono text-[0.62rem] text-ghost-500">
                {lang === "zh" ? "深度" : "depth"}
                <input
                  type="range"
                  min={3}
                  max={LAYERS.length}
                  step={1}
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-20 accent-signal-500 sm:w-28"
                  aria-label="depth"
                />
                <span className="text-signal-300">{depth}</span>
              </label>
              <label className="flex items-center gap-2 font-mono text-[0.62rem] text-ghost-500">
                {lang === "zh" ? "速度" : "speed"}
                <input
                  type="range"
                  min={0.4}
                  max={2.2}
                  step={0.1}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-20 accent-flux-500 sm:w-24"
                  aria-label="speed"
                />
                <span className="text-flux-400">{speed.toFixed(1)}×</span>
              </label>
            </div>
          </div>
        </div>

        {/* ---------------- side legend ---------------- */}
        <div className="holo rounded-xl p-4">
          <span className="label-mono">{lang === "zh" ? "信息栈" : "The Information Stack"}</span>
          <ol className="mt-3 space-y-1.5">
            {LAYERS.map((L, i) => {
              const reached = i <= doneIdx;
              const inScope = i < depth;
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-[0.74rem] transition ${
                    reached ? "bg-signal-500/[0.07]" : ""
                  } ${inScope ? "" : "opacity-30"}`}
                >
                  <span className={`mono text-[0.6rem] ${reached ? accent : "text-ghost-700"}`}>
                    {String(i).padStart(2, "0")}
                  </span>
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${reached ? "glow-pulse" : ""}`}
                    style={{
                      background: reached
                        ? ["#23e6b3", "#2fc6f5", "#f5b338", "#ff4da6"][i % 4]
                        : "rgba(92,242,204,0.18)",
                    }}
                  />
                  <span className={`${reached ? "text-ghost-100" : "text-ghost-500"} ${lang === "zh" ? "zh" : ""}`}>
                    {L.name[lang]}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="my-3 h-px rule-sig" />

          <span className="label-mono">{lang === "zh" ? "递归律" : "The Recurring Law"}</span>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-ghost-200">
            <T v={LAW} />
          </p>
          <p className="mt-3 font-mono text-[0.62rem] text-signal-400/80">
            {lang === "zh"
              ? "// 压缩 → 传输 → 纠错 → 计算 → 基底"
              : "// compress → transmit → correct → compute → substrate"}
          </p>
        </div>
      </div>

      {/* caption */}
      <div className="mt-5 rounded-lg border border-wire-500/15 bg-void-900/50 p-4">
        <div className="display mb-1 text-sm wire-text">
          <T v={{ en: "The same process, recursing", zh: "同一过程，层层递归" }} />
        </div>
        <p className="text-[0.82rem] leading-relaxed text-ghost-200">
          <T
            v={{
              en: "From quantum events to planetary networks, one motif repeats: information is captured, copied, corrected, and computed — and each completed layer becomes the raw material of the next. Run the console and watch the metric climb through orders of magnitude. The open question is whether this ascent converges on a single planetary-scale information organism that thinks at the speed of light.",
              zh: "从量子事件到行星网络，一个母题反复出现：信息被捕获、复制、纠错、计算——每完成一层，便成为上一层的原料。运行控制台，看吞吐量穿越数量级攀升。悬而未决的问题是：这一上升是否正收敛为一个以光速思考、行星尺度的单一信息有机体。",
            }}
          />
        </p>
      </div>
    </div>
  );
}
