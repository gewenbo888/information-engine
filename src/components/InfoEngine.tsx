"use client";

import { ReactNode } from "react";
import { LangProvider, LangToggle, T, useLang, t } from "./lang";
import { SECTIONS, FUTURES, BIG_QUESTIONS, META_TERMS } from "./content";
import InfoCanvas from "./InfoCanvas";
import EntropyEngine from "./EntropyEngine";
import SymbolTree from "./SymbolTree";
import DNAHelix from "./DNAHelix";
import TuringTape from "./TuringTape";
import InfoNetwork from "./InfoNetwork";
import ConsensusChain from "./ConsensusChain";
import EmbeddingSpace from "./EmbeddingSpace";
import QuantumField from "./QuantumField";
import MemeSpread from "./MemeSpread";
import RecursiveConsole from "./RecursiveConsole";
import InfoPowerModel from "./InfoPowerModel";

const VIS: Record<string, ReactNode> = {
  origin: <EntropyEngine />,
  symbol: <SymbolTree />,
  dna: <DNAHelix />,
  computation: <TuringTape />,
  network: <InfoNetwork />,
  crypto: <ConsensusChain />,
  ai: <EmbeddingSpace />,
  quantum: <QuantumField />,
  memes: <MemeSpread />,
  future: (
    <div className="space-y-12">
      <RecursiveConsole />
      <FuturesGrid />
    </div>
  ),
};

function Logo() {
  return (
    <svg viewBox="0 0 36 36" className="h-8 w-8">
      <g stroke="#23e6b3" strokeWidth="1.5" fill="none" opacity="0.9" strokeLinecap="round">
        <path d="M6 18h6" />
        <path d="M24 18h6" />
        <path d="M18 9v-3" />
        <path d="M18 30v-3" />
      </g>
      <circle cx="18" cy="18" r="4" fill="none" stroke="#5cf2cc" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="1.5" fill="#ff4da6" />
      <circle cx="6" cy="18" r="2" fill="#2fc6f5" />
      <circle cx="30" cy="18" r="2" fill="#f5b338" />
      <circle cx="18" cy="6" r="1.8" fill="#5cf2cc" />
      <circle cx="18" cy="30" r="1.8" fill="#5cf2cc" />
    </svg>
  );
}

function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-signal-500/12 bg-void-950/80 px-5 py-3 backdrop-blur md:px-9">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <div className="display text-base text-ghost-50">Information Engine</div>
          <div className="zh text-[0.6rem] text-ghost-500">信息引擎</div>
        </div>
      </div>
      <nav className="hidden gap-5 font-mono text-[0.56rem] uppercase tracking-[0.18em] text-ghost-500 xl:flex">
        <a href="#origin" className="hover:text-signal-400">Origin</a>
        <a href="#symbol" className="hover:text-signal-400">Symbol</a>
        <a href="#dna" className="hover:text-signal-400">DNA</a>
        <a href="#computation" className="hover:text-signal-400">Compute</a>
        <a href="#network" className="hover:text-signal-400">Network</a>
        <a href="#ai" className="hover:text-signal-400">AI</a>
        <a href="#quantum" className="hover:text-signal-400">Quantum</a>
        <a href="#future" className="hover:text-signal-400">Future</a>
      </nav>
      <div className="flex items-center gap-3">
        <LangToggle />
        <a href="https://psyverse.fun" className="hidden font-mono text-[0.56rem] uppercase tracking-[0.18em] text-wire-400 hover:text-signal-400 sm:block">← Psyverse</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
      <div className="absolute inset-0 z-0 opacity-90"><InfoCanvas /></div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-void-950/30 via-transparent to-void-950" />
      <div className="relative z-20 mx-auto w-full max-w-6xl px-6 md:px-12">
        <div className="label-mono">Psyverse · An atlas of information</div>
        <div className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost-500">
          EN · 中文 · bits → DNA → language → computation → networks → AI → qubits
        </div>
        <h1 className="display mt-6 text-6xl leading-[0.95] text-ghost-50 md:text-8xl">
          Information <span className="signal-text">Engine</span>
        </h1>
        <h2 className="zh mt-3 text-3xl text-ghost-200 md:text-5xl">信息引擎</h2>

        <p className="mt-9 max-w-2xl text-lg leading-relaxed text-ghost-100 md:text-xl">
          <T v={{
            en: "Civilization is the history of information becoming denser, faster, more abstract, more networked — and increasingly intelligent. From the bit to the genome to the embedding to the qubit, one structure keeps recurring at ever-larger scale. This is an atlas of that structure.",
            zh: "文明，是信息不断变得更稠密、更迅捷、更抽象、更网络化——并日益智能的历史。从比特，到基因组，到嵌入向量，再到量子比特，同一种结构，在越来越大的尺度上反复出现。这，是一幅关于那种结构的地图。",
          }} />
        </p>

        <div className="mt-10 max-w-2xl holo rounded-lg p-6">
          <div className="label-mono">Central thesis · 核心论点</div>
          <p className="mt-3 text-xl leading-relaxed text-ghost-50 md:text-2xl">
            <T v={{
              en: "Information may not merely describe reality. It may be one of the deepest substrates from which matter, life, intelligence and reality itself emerge.",
              zh: "信息，也许不仅仅是对现实的描述。它，也许是物质、生命、智能乃至现实本身得以涌现的、最深层的基底之一。",
            }} />
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ghost-500">
          <span>10 systems · 十大系统</span>
          <span>live simulations · 实时模拟</span>
          <span>entropy · code · networks · qubits</span>
        </div>
      </div>
    </section>
  );
}

function SectionBlock({ num, id, title, sub, body, vis }: { num: string; id: string; title: any; sub: any; body: any; vis?: ReactNode }) {
  return (
    <section id={id} className="relative border-t border-signal-500/8 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline gap-4">
          <span className="display text-5xl text-signal-500/25">{num}</span>
          <div>
            <h2 className="display text-4xl text-ghost-50 md:text-5xl"><T v={title} /></h2>
            <h3 className="mt-1 text-lg text-wire-400"><T v={sub} /></h3>
          </div>
        </div>
        <div className="mt-5 h-px rule-sig opacity-50" />
        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ghost-200"><T v={body} /></p>
        {vis && <div className="mt-12">{vis}</div>}
      </div>
    </section>
  );
}

/* ---- Section 10 : future systems grid ---- */
function FuturesGrid() {
  const { lang } = useLang();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FUTURES.map((f, i) => (
        <div key={i} className="holo rounded-xl p-5" style={{ borderTopColor: f.accent, borderTopWidth: 2 }}>
          <div className="flex items-center justify-between gap-3">
            <span className={`display text-lg text-ghost-50 ${lang === "zh" ? "zh" : ""}`}>{t(f.name, lang)}</span>
            <span className="font-mono text-[0.55rem] uppercase tracking-wider" style={{ color: f.accent }}>{t(f.horizon, lang)}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ghost-300">{t(f.desc, lang)}</p>
        </div>
      ))}
    </div>
  );
}

/* ---- open questions ---- */
function QuestionsBlock() {
  const { lang } = useLang();
  return (
    <section id="questions" className="relative border-t border-signal-500/8 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="label-mono">Open questions · 未解之问</div>
        <h2 className="display mt-3 text-4xl text-ghost-50 md:text-5xl">
          <T v={{ en: "What we still do not know", zh: "我们仍不知道的" }} />
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ghost-200">
          <T v={{
            en: "The deeper one follows information, the more the easy answers dissolve. These are not rhetorical questions — they are live problems at the edge of physics, biology, computer science and philosophy.",
            zh: "越是深入追随信息，那些轻易的答案就越是消解。这些并非修辞性的问题——它们是物理学、生物学、计算机科学与哲学边缘上，悬而未决的活问题。",
          }} />
        </p>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {BIG_QUESTIONS.map((q, i) => (
            <div key={i} className="holo flex gap-4 rounded-xl p-5">
              <span className="mono shrink-0 text-2xl text-pulse-400/60">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className={`text-base leading-snug text-ghost-50 ${lang === "zh" ? "zh" : "display"}`}>{t(q.q, lang)}</div>
                <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-wire-400/80">{t(q.lens, lang)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- meta-model ---- */
function MetaModelBlock() {
  const { lang } = useLang();
  return (
    <section id="model" className="relative border-t border-signal-500/8 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="label-mono">Meta-model · 元模型</div>
        <h2 className="display mt-3 text-4xl text-ghost-50 md:text-5xl">
          <T v={{ en: "The anatomy of information power", zh: "信息力的解剖" }} />
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ghost-200">
          <T v={{
            en: "Every information system — a genome, a language, the internet, a model — can be read as a different weighting of seven capacities. Plot their profiles and the systems that reshaped history reveal why: each one pushed some of these terms far past what came before.",
            zh: "每一个信息系统——一段基因组、一门语言、互联网、一个模型——都可被解读为这七项能力的不同加权。绘出它们的剖面，那些重塑了历史的系统便揭示出原因：每一个，都把其中某些项，推到了远超前者的程度。",
          }} />
        </p>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {META_TERMS.map((m) => (
            <div key={m.key} className="rounded-lg border border-signal-500/15 bg-void-900/40 p-3">
              <div className="flex items-center gap-2">
                <span className="mono text-signal-400">{m.sym}</span>
                <span className={`text-sm text-ghost-100 ${lang === "zh" ? "zh" : "display"}`}>{t(m.name, lang)}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ghost-500">{t(m.def, lang)}</p>
            </div>
          ))}
        </div>
        <div className="mt-12"><InfoPowerModel /></div>
      </div>
    </section>
  );
}

function Body() {
  const { lang } = useLang();
  return (
    <main className="relative bg-void-950 text-ghost-100">
      <Header />
      <Hero />

      <div className="grid-bg border-y border-signal-500/12 bg-void-900/60 py-2.5 overflow-hidden">
        <div className="whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.3em] text-wire-400/70 ticker inline-block">
          {(lang === "zh"
            ? "比特 · 熵 · 香农 · 符号 · DNA · 图灵机 · 算法 · 纠错 · 网络 · 共识 · 零知识证明 · 嵌入 · 压缩 · 量子比特 · 纠缠 · 模因 · 集体智能 · 行星认知 · "
            : "BIT · ENTROPY · SHANNON · SYMBOL · DNA · TURING MACHINE · ALGORITHM · ERROR CORRECTION · NETWORK · CONSENSUS · ZERO-KNOWLEDGE · EMBEDDING · COMPRESSION · QUBIT · ENTANGLEMENT · MEME · COLLECTIVE INTELLIGENCE · PLANETARY COGNITION · ").repeat(2)}
        </div>
      </div>

      {SECTIONS.map((s) => (
        <SectionBlock key={s.id} num={s.num} id={s.id} title={s.title} sub={s.sub} body={s.body} vis={VIS[s.id]} />
      ))}

      <QuestionsBlock />
      <MetaModelBlock />

      {/* Closing */}
      <section className="relative border-t border-signal-500/8 px-6 py-32 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="display text-4xl leading-snug text-ghost-50 md:text-6xl">
            <T v={{ en: "It from bit — or bit from it?", zh: "万物源于比特——还是比特源于万物？" }} />
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ghost-300">
            <T v={{
              en: "We began with difference and ended with a planet wired into one updating mind. The same operations — store, copy, compress, transmit, correct, compute — recur from molecules to markets to models. Whether information merely describes the world or partly constitutes it remains open. But the trajectory is unmistakable: matter learned to remember, then to speak, then to think. The engine is still accelerating, and we are its latest medium.",
              zh: "我们以差异为起点，以一颗接入了单一刷新心智的星球为终点。同样的操作——存储、复制、压缩、传输、纠错、计算——从分子，到市场，到模型，反复出现。信息究竟只是描述世界，还是在某种程度上构成了世界，仍未有定论。但那条轨迹清晰可辨：物质学会了记忆，继而学会了言说，继而学会了思考。引擎仍在加速，而我们，是它最新的介质。",
            }} />
          </p>
          <div className="mx-auto mt-10 max-w-xl rounded-lg border border-pulse-500/25 bg-void-900/60 p-5">
            <p className="text-xs leading-relaxed text-ghost-500">
              <T v={{
                en: "An educational synthesis of information theory, computer science, biology, cryptography and philosophy. The simulations are illustrative simplifications, not exact replicas of production systems. Open questions are stated as open.",
                zh: "一份融合信息论、计算机科学、生物学、密码学与哲学的教育性综述。文中的模拟为示意性的简化，并非生产系统的精确复刻。悬而未决的问题，如实陈述为悬而未决。",
              }} />
            </p>
          </div>
          <div className="mx-auto mt-12 h-px w-40 rule-sig" />
          <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.4em] text-wire-400/70">
            Information Engine · 信息引擎 · Psyverse · 2026
          </p>
        </div>
      </section>

      <footer className="border-t border-signal-500/12 bg-void-950 px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <div className="display text-xl text-ghost-50">Information Engine</div>
            <div className="zh mt-1 text-sm text-ghost-300">信息引擎</div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ghost-500">
              <T v={{ en: "The nature of information, computation, communication, intelligence and reality.", zh: "信息、计算、通信、智能与现实的本质。" }} />
            </p>
          </div>
          <div>
            <div className="label-mono">Systems · 系统</div>
            <ul className="mt-4 space-y-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ghost-500">
              {SECTIONS.slice(0, 6).map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="hover:text-signal-400">{s.num} · <T v={s.title} /></a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label-mono">Companion archives</div>
            <ul className="mt-4 space-y-1.5 text-sm text-ghost-300">
              <li><a href="https://beyond-tech.psyverse.fun" className="hover:text-signal-300">Beyond Technology · 技术之上</a></li>
              <li><a href="https://ai-genesis.psyverse.fun" className="hover:text-signal-300">AI Genesis · AI 创世</a></li>
              <li><a href="https://civilization-kernel.psyverse.fun" className="hover:text-signal-300">Civilization Kernel · 文明内核</a></li>
              <li className="pt-3"><a href="https://psyverse.fun" className="text-wire-400 hover:text-signal-300">↩ All Psyverse archives</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 h-px max-w-7xl rule-sig" />
        <div className="mx-auto mt-6 flex max-w-7xl items-center justify-between text-[0.58rem] uppercase tracking-[0.3em] text-ghost-500">
          <div>© 2026 Gewenbo · Psyverse</div>
          <div>EN · 中文 · educational</div>
        </div>
      </footer>
    </main>
  );
}

export default function InfoEngine() {
  return (
    <LangProvider>
      <Body />
    </LangProvider>
  );
}
