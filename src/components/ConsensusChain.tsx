"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang, T, t, type Bi } from "./lang";

/* ─────────────────────────────────────────────────────────────────────
   MONEY, CRYPTOGRAPHY & CONSENSUS
   Animated longest-chain blockchain + toy avalanche hash demo + a
   ledger/consensus concept panel + a one-line ZK reveal/prove toggle.
   Pure React + SVG + CSS. Illustrative — NOT cryptographic.
   ───────────────────────────────────────────────────────────────────── */

// FNV-1a-style 32-bit string hash → 8 hex chars. Deterministic, avalanching.
function toyHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // extra mixing so a 1-char edit cascades visibly
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0).toString(16).padStart(8, "0");
}

type Block = {
  id: number;
  height: number;
  hash: string;
  prev: string;
  state: "appearing" | "canon" | "fork" | "orphan";
  born: number; // timestamp for animation
};

const GENESIS_PREV = "00000000";

export default function ConsensusChain() {
  const { lang } = useLang();

  /* ── blockchain animation ───────────────────────────────────────── */
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const g: Block = {
      id: 0, height: 0, hash: toyHash("genesis"), prev: GENESIS_PREV,
      state: "canon", born: 0,
    };
    return [g];
  });
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // mint a new block (or a fork) on a timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setBlocks((prev) => {
        const canon = prev.filter((b) => b.state === "canon" || b.state === "appearing");
        const tip = canon[canon.length - 1];
        const now = performance.now();
        const next: Block[] = prev.map((b) =>
          b.state === "appearing" ? { ...b, state: "canon" } : b
        );

        // ~25% chance to fork (only if there isn't already a live fork)
        const hasFork = prev.some((b) => b.state === "fork");
        if (!hasFork && Math.random() < 0.28 && tip.height > 0) {
          const h = tip.height + 1;
          const a: Block = {
            id: idRef.current++, height: h, prev: tip.hash,
            hash: toyHash(tip.hash + ":a" + idRef.current), state: "appearing", born: now,
          };
          const b: Block = {
            id: idRef.current++, height: h, prev: tip.hash,
            hash: toyHash(tip.hash + ":b" + idRef.current), state: "fork", born: now,
          };
          return [...next, a, b];
        }

        // otherwise extend the canonical tip
        const h = tip.height + 1;
        const blk: Block = {
          id: idRef.current++, height: h, prev: tip.hash,
          hash: toyHash(tip.hash + ":" + idRef.current), state: "appearing", born: now,
        };
        let out = [...next, blk];

        // longest-chain resolution: a leftover fork loses → orphan
        if (hasFork) {
          out = out.map((bb) => (bb.state === "fork" ? { ...bb, state: "orphan" as const } : bb));
        }
        // trim history & drop fully-faded orphans
        if (out.length > 14) {
          // keep recent; remove old orphans first
          const orphansOld = out.filter((b) => b.state === "orphan");
          if (orphansOld.length) out = out.filter((b) => b.id !== orphansOld[0].id);
          else out = out.slice(out.length - 14);
        }
        return out;
      });
      timer = setTimeout(tick, 2200 + Math.random() * 900);
    };
    timer = setTimeout(tick, 1600);
    return () => clearTimeout(timer);
  }, []);

  // auto-scroll the chain to the newest block
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [blocks.length]);

  /* ── toy hash / avalanche demo ──────────────────────────────────── */
  const [text, setText] = useState("send 10 coins to Bob");
  const hash = toyHash(text);

  /* ── ZK reveal vs prove toggle ──────────────────────────────────── */
  const [zkMode, setZkMode] = useState<"reveal" | "prove">("prove");

  const canonChain = blocks.filter((b) => b.state === "canon" || b.state === "appearing");
  const tipHeight = canonChain.length ? canonChain[canonChain.length - 1].height : 0;

  return (
    <div className="w-full">
      {/* ── blockchain visualizer ────────────────────────────────── */}
      <div className="holo relative overflow-hidden rounded-xl p-3 sm:p-4">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mb-3 flex items-center justify-between">
          <span className="label-mono">
            {t({ en: "LONGEST-CHAIN CONSENSUS", zh: "最长链共识" }, lang)}
          </span>
          <span className="label-mono signal-text">
            {t({ en: "HEIGHT", zh: "区块高度" }, lang)} {tipHeight}
          </span>
        </div>
        <div ref={scrollRef} className="relative flex items-stretch gap-0 overflow-x-auto pb-2">
          {blocks.map((b, i) => (
            <ChainBlock key={b.id} block={b} first={i === 0} lang={lang} />
          ))}
        </div>
        <div className="relative mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] mono text-ghost-500">
          <Legend color="#5cf2cc" label={{ en: "canonical", zh: "正统链" }} lang={lang} />
          <Legend color="#67d8fb" label={{ en: "competing fork", zh: "竞争分叉" }} lang={lang} />
          <Legend color="#ff79bf" label={{ en: "orphaned", zh: "孤块" }} lang={lang} />
        </div>
      </div>

      {/* ── hash / avalanche demo ───────────────────────────────────── */}
      <div className="holo mt-4 rounded-xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="label-mono">{t({ en: "AVALANCHE EFFECT", zh: "雪崩效应" }, lang)}</span>
          <span className="rounded border border-pulse-500/30 px-2 py-0.5 text-[0.55rem] mono pulse-text">
            {t({ en: "ILLUSTRATIVE · NOT CRYPTOGRAPHIC", zh: "示意 · 非真实密码学" }, lang)}
          </span>
        </div>
        <label className="block text-xs text-ghost-300 mb-1.5">
          <T v={{ en: "Edit the message — watch the digest scramble:", zh: "编辑消息——看摘要剧烈变化：" }} />
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="w-full rounded-lg border border-wire-500/30 bg-void-900/80 px-3 py-2 text-sm text-ghost-50 outline-none transition focus:border-signal-500/60 mono"
        />
        <div className="mt-3 flex items-center gap-3">
          <span className="label-mono">{t({ en: "DIGEST", zh: "摘要" }, lang)}</span>
          <div className="flex flex-1 gap-1 overflow-hidden">
            {hash.split("").map((c, i) => (
              <span
                key={i + c + text.length}
                className="rise-in inline-flex h-7 w-7 items-center justify-center rounded bg-void-800 text-sm signal-text mono"
                style={{ animationDuration: "0.3s", animationDelay: `${i * 18}ms` }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-ghost-500">
          <T
            v={{
              en: "A one-character edit changes nearly every output digit — yet the same input always yields the same digest. That determinism + sensitivity is what lets a ledger detect any tampering.",
              zh: "改动一个字符几乎会改变所有输出位——但相同输入永远得到相同摘要。这种确定性与敏感性，正是账本得以察觉任何篡改的基础。",
            }}
          />
        </p>
      </div>

      {/* ── concept panel ───────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c) => (
          <div key={c.key} className="holo rounded-xl p-3.5">
            <div className={`label-mono ${c.tone}`}>{t(c.term, lang)}</div>
            <p className={`mt-1.5 text-[0.8rem] leading-relaxed text-ghost-200 ${lang === "zh" ? "zh" : ""}`}>
              {c.body[lang]}
            </p>
          </div>
        ))}
      </div>

      {/* ── ZK toggle ───────────────────────────────────────────────── */}
      <div className="holo mt-4 rounded-xl p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label-mono">
            {t({ en: "ZERO-KNOWLEDGE · PROVE WITHOUT REVEALING", zh: "零知识 · 不暴露即可证明" }, lang)}
          </span>
          <div className="flex overflow-hidden rounded-full border border-signal-500/30 text-[0.7rem] mono">
            <button
              onClick={() => setZkMode("reveal")}
              className={`px-3 py-1 transition ${zkMode === "reveal" ? "bg-pulse-500/20 pulse-text" : "text-ghost-500 hover:text-pulse-400"}`}
            >
              {t({ en: "Reveal", zh: "暴露" }, lang)}
            </button>
            <button
              onClick={() => setZkMode("prove")}
              className={`px-3 py-1 transition ${zkMode === "prove" ? "bg-signal-500/20 signal-text" : "text-ghost-500 hover:text-signal-400"}`}
            >
              {t({ en: "Prove", zh: "证明" }, lang)}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* the claim */}
          <div className="rounded-lg border border-void-600 bg-void-900/60 p-3">
            <div className="text-[0.6rem] mono text-ghost-500">{t({ en: "CLAIM", zh: "主张" }, lang)}</div>
            <div className="mt-1 text-sm text-ghost-100">
              <T v={{ en: "“I know a secret x — e.g. I am over 18.”", zh: "“我知道秘密 x——例如：我已年满 18 岁。”" }} />
            </div>
            <div className="mt-2 text-[0.6rem] mono text-ghost-500">{t({ en: "SECRET x", zh: "秘密 x" }, lang)}</div>
            <div className="mt-1 mono text-sm">
              {zkMode === "reveal" ? (
                <span className="pulse-text">birthdate = 2003-08-14</span>
              ) : (
                <span className="signal-text">•••••••• {t({ en: "(never sent)", zh: "（从不发送）" }, lang)}</span>
              )}
            </div>
          </div>

          {/* what the verifier learns */}
          <div key={zkMode} className="rise-in rounded-lg border border-signal-500/30 bg-signal-500/5 p-3">
            <div className="text-[0.6rem] mono text-ghost-500">
              {t({ en: "WHAT THE VERIFIER LEARNS", zh: "验证方所知" }, lang)}
            </div>
            {zkMode === "reveal" ? (
              <>
                <div className="mt-1 text-sm pulse-text">
                  <T v={{ en: "Everything: full birthdate + identity exposed.", zh: "一切：完整出生日期与身份全部暴露。" }} />
                </div>
                <div className="mt-2 text-[0.7rem] leading-relaxed text-ghost-400">
                  <T v={{ en: "Privacy traded away to gain trust.", zh: "为换取信任而交出隐私。" }} />
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-sm signal-text">
                  <T v={{ en: "Exactly one bit: “the claim is true.”", zh: "仅一个比特：“主张为真。”" }} />
                </div>
                <div className="mt-2 text-[0.7rem] leading-relaxed text-ghost-400">
                  <T v={{ en: "Verifier is convinced x exists, learns nothing about x itself.", zh: "验证方确信 x 存在，却对 x 本身一无所知。" }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Psy Protocol note — accurate & respectful */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-signal-500/20 bg-void-900/50 p-3">
          <span className="signal-text display text-lg leading-none">ψ</span>
          <p className={`text-[0.78rem] leading-relaxed text-ghost-300 ${lang === "zh" ? "zh" : ""}`}>
            <T
              v={{
                en: "Psy Protocol is a privacy-focused, independent public blockchain — its own chain — that uses zero-knowledge proofs (built on Plonky2 over the Goldilocks field with Poseidon hashing) to settle fully private transactions.",
                zh: "Psy 协议是一条注重隐私的独立公链——它是自己的链——通过零知识证明（基于 Goldilocks 域上的 Plonky2 与 Poseidon 哈希构建）来结算完全私密的交易。",
              }}
            />
          </p>
        </div>
      </div>

      {/* caption */}
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ghost-300">
        <T
          v={{
            en: "Trust used to require a central authority. Cryptography lets strangers agree on shared information — one history, one ledger — without one.",
            zh: "信任曾经必须依赖一个中心权威。而密码学让素不相识的人无需中心，就能就共享信息——同一段历史、同一本账本——达成一致。",
          }}
        />
      </p>
    </div>
  );
}

/* ── sub-components ──────────────────────────────────────────────── */

function ChainBlock({ block, first, lang }: { block: Block; first: boolean; lang: ReturnType<typeof useLang>["lang"] }) {
  const isOrphan = block.state === "orphan";
  const isFork = block.state === "fork";
  const ring =
    isOrphan ? "border-pulse-500/60" : isFork ? "border-wire-500/60" : "border-signal-500/50";
  const tone = isOrphan ? "pulse-text" : isFork ? "wire-text" : "signal-text";
  const linkColor = isOrphan ? "#ff4da6" : isFork ? "#2fc6f5" : "#23e6b3";

  return (
    <div className="flex items-center">
      {/* prev-pointer link (skip for genesis) */}
      {!first && (
        <svg width="34" height="64" className="shrink-0" aria-hidden>
          <defs>
            <marker id={`ar-${block.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={linkColor} />
            </marker>
          </defs>
          <line
            x1="2" y1={isFork ? 18 : 32} x2="30" y2="32"
            stroke={linkColor} strokeWidth="1.5"
            strokeDasharray="4 4"
            markerEnd={`url(#ar-${block.id})`}
            className={block.state === "canon" || block.state === "fork" ? "flow" : undefined}
            style={{ opacity: isOrphan ? 0.4 : 0.9 }}
          />
        </svg>
      )}
      <div
        className={`relative shrink-0 rounded-lg border ${ring} bg-void-800/80 px-3 py-2 transition-all duration-700 ${
          block.state === "appearing" ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          width: 120,
          opacity: isOrphan ? 0.45 : undefined,
          boxShadow: isFork ? "0 0 24px -10px rgba(47,198,245,0.6)" : isOrphan ? undefined : "0 0 24px -12px rgba(35,230,179,0.6)",
        }}
      >
        {isOrphan && (
          <span className="absolute -top-2 left-2 rounded bg-void-950 px-1 text-[0.5rem] mono pulse-text">
            {t({ en: "orphan", zh: "孤块" }, lang)}
          </span>
        )}
        {isFork && (
          <span className="absolute -top-2 left-2 rounded bg-void-950 px-1 text-[0.5rem] mono wire-text">
            {t({ en: "fork?", zh: "分叉？" }, lang)}
          </span>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[0.55rem] mono text-ghost-500">
            {t({ en: "BLOCK", zh: "区块" }, lang)} #{block.height}
          </span>
        </div>
        <div className={`mt-1 mono text-[0.72rem] ${tone}`}>{block.hash}</div>
        <div className="mt-1.5 text-[0.5rem] mono text-ghost-500">
          {t({ en: "prev", zh: "前块" }, lang)}
        </div>
        <div className="mono text-[0.62rem] text-ghost-300">{block.prev}</div>
      </div>
    </div>
  );
}

function Legend({ color, label, lang }: { color: string; label: Bi; lang: ReturnType<typeof useLang>["lang"] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className={lang === "zh" ? "zh" : ""}>{label[lang]}</span>
    </span>
  );
}

/* ── concept data ───────────────────────────────────────────────── */

const CONCEPTS: { key: string; term: Bi; body: Bi; tone: string }[] = [
  {
    key: "money", tone: "flux-text",
    term: { en: "Money = Memory", zh: "货币 = 记忆" },
    body: {
      en: "Money is a society's shared memory of who owes whom — a portable, fungible record of past contribution and trust.",
      zh: "货币是社会关于“谁欠谁”的共享记忆——一份可携带、可互换的、关于过往贡献与信任的记录。",
    },
  },
  {
    key: "ledger", tone: "signal-text",
    term: { en: "Ledger = Shared State", zh: "账本 = 共享状态" },
    body: {
      en: "Accounting is information bookkeeping; a ledger is shared memory. The hard problem is agreeing on one copy.",
      zh: "会计就是信息记账；账本即共享记忆。真正的难题是就唯一一份副本达成一致。",
    },
  },
  {
    key: "crypto", tone: "wire-text",
    term: { en: "Cryptography = Sealed Truth", zh: "密码学 = 封存的真相" },
    body: {
      en: "Hashes and signatures let anyone verify a record without trusting its author — math replaces the middleman.",
      zh: "哈希与签名让任何人无需信任作者即可验证记录——用数学取代中间人。",
    },
  },
  {
    key: "btc", tone: "flux-text",
    term: { en: "Bitcoin · Proof-of-Work", zh: "比特币 · 工作量证明" },
    body: {
      en: "Bitcoin spends real energy so the longest chain is costly to forge — turning electricity into agreement.",
      zh: "比特币消耗真实能量，使最长链难以伪造——把电力转化为共识。",
    },
  },
  {
    key: "eth", tone: "wire-text",
    term: { en: "Ethereum · Programmable", zh: "以太坊 · 可编程合约" },
    body: {
      en: "Ethereum makes the ledger programmable: contracts are agreements that execute themselves on shared state.",
      zh: "以太坊让账本可编程：合约即在共享状态上自我执行的协议。",
    },
  },
  {
    key: "zk", tone: "pulse-text",
    term: { en: "ZK · Identity", zh: "零知识 · 数字身份" },
    body: {
      en: "Zero-knowledge proofs verify a fact while hiding the data — digital identity that proves a claim without exposing you.",
      zh: "零知识证明在隐藏数据的同时验证事实——数字身份得以证明主张而不暴露你本人。",
    },
  },
];
