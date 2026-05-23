"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLang, T, t, Bi } from "./lang";

/* ============================================================
   COMPUTATION & ALGORITHMS — TuringTape
   A) A real, runnable Turing machine (Turing 1936)
   B) Hamming(7,4) error correction (Hamming 1950)
   ============================================================ */

type Move = "L" | "R" | "S";
type Rule = { read: string; write: string; move: Move; next: string };
type Program = {
  id: string;
  name: Bi;
  blurb: Bi;
  blank: string;
  start: string;
  halt: string;
  initial: string; // initial tape window (left→right)
  headStart: number; // index into initial where head begins
  states: { id: string; label: Bi }[];
  table: Record<string, Rule[]>; // keyed by state id
};

/* ---- Program 1: binary increment (add 1 to a binary number) ---- */
const P_INCREMENT: Program = {
  id: "inc",
  name: { en: "Binary increment", zh: "二进制加一" },
  blurb: {
    en: "Walk to the least-significant bit, then carry leftward: 1→0 and continue, 0→1 and halt.",
    zh: "走到最低位，再向左进位：遇 1 写 0 继续，遇 0 写 1 并停机。",
  },
  blank: "_",
  start: "seek",
  halt: "done",
  initial: "_1011_",
  headStart: 1,
  states: [
    { id: "seek", label: { en: "seek end", zh: "找末位" } },
    { id: "carry", label: { en: "add carry", zh: "做进位" } },
    { id: "done", label: { en: "halt", zh: "停机" } },
  ],
  table: {
    seek: [
      { read: "0", write: "0", move: "R", next: "seek" },
      { read: "1", write: "1", move: "R", next: "seek" },
      { read: "_", write: "_", move: "L", next: "carry" },
    ],
    carry: [
      { read: "1", write: "0", move: "L", next: "carry" },
      { read: "0", write: "1", move: "S", next: "done" },
      { read: "_", write: "1", move: "S", next: "done" },
    ],
  },
};

/* ---- Program 2: unary doubler — copy n ones into 2n ones ---- */
const P_DOUBLE: Program = {
  id: "dbl",
  name: { en: "Unary doubler", zh: "一进制倍增" },
  blurb: {
    en: "Each 1 is rewritten as a marker, ferried across the gap, and re-emitted as two — turning n into 2n.",
    zh: "每个 1 标记后越过空隙，再生成两个，把 n 变成 2n。",
  },
  blank: "_",
  start: "scan",
  halt: "done",
  initial: "_111__________",
  headStart: 1,
  states: [
    { id: "scan", label: { en: "scan", zh: "扫描" } },
    { id: "ferry", label: { en: "ferry", zh: "搬运" } },
    { id: "write", label: { en: "emit ×2", zh: "写两个" } },
    { id: "back", label: { en: "rewind", zh: "回卷" } },
    { id: "done", label: { en: "halt", zh: "停机" } },
  ],
  table: {
    scan: [
      { read: "1", write: "X", move: "R", next: "ferry" },
      { read: "X", write: "X", move: "R", next: "scan" },
      { read: "_", write: "_", move: "S", next: "done" },
    ],
    ferry: [
      { read: "1", write: "1", move: "R", next: "ferry" },
      { read: "X", write: "X", move: "R", next: "ferry" },
      { read: "O", write: "O", move: "R", next: "ferry" },
      { read: "_", write: "O", move: "R", next: "write" },
    ],
    write: [
      { read: "_", write: "O", move: "L", next: "back" },
    ],
    back: [
      { read: "O", write: "O", move: "L", next: "back" },
      { read: "1", write: "1", move: "L", next: "back" },
      { read: "X", write: "1", move: "R", next: "scan" },
    ],
  },
};

/* ---- Program 3: parity / odd-count test on a block of 1s ---- */
const P_PARITY: Program = {
  id: "par",
  name: { en: "Parity test", zh: "奇偶判定" },
  blurb: {
    en: "Toggle a flag on every 1. At the blank, write E (even) or O (odd) — the deciding bit.",
    zh: "每遇一个 1 翻转一次标志；到空格时写 E（偶）或 O（奇）——判定位。",
  },
  blank: "_",
  start: "even",
  halt: "done",
  initial: "_11111_",
  headStart: 1,
  states: [
    { id: "even", label: { en: "even so far", zh: "目前为偶" } },
    { id: "odd", label: { en: "odd so far", zh: "目前为奇" } },
    { id: "done", label: { en: "halt", zh: "停机" } },
  ],
  table: {
    even: [
      { read: "1", write: "1", move: "R", next: "odd" },
      { read: "_", write: "E", move: "S", next: "done" },
    ],
    odd: [
      { read: "1", write: "1", move: "R", next: "even" },
      { read: "_", write: "O", move: "S", next: "done" },
    ],
  },
};

const PROGRAMS = [P_INCREMENT, P_DOUBLE, P_PARITY];

type TMState = {
  tape: string[];
  head: number;
  state: string;
  steps: number;
  halted: boolean;
  activeRead: string | null; // symbol read on the most recent step (table highlight)
  wrote: number | null; // index just written (cell flash)
};

function initTM(p: Program): TMState {
  return {
    tape: p.initial.split(""),
    head: p.headStart,
    state: p.start,
    steps: 0,
    halted: false,
    activeRead: null,
    wrote: null,
  };
}

function stepTM(prev: TMState, p: Program): TMState {
  if (prev.halted) return prev;
  const tape = prev.tape.slice();
  // grow the tape if the head ever sits at an edge
  let head = prev.head;
  if (head <= 0) {
    tape.unshift(p.blank);
    head += 1;
  }
  if (head >= tape.length - 1) tape.push(p.blank);

  const sym = tape[head] ?? p.blank;
  const rules = p.table[prev.state] ?? [];
  const rule = rules.find((r) => r.read === sym);
  if (!rule || prev.state === p.halt) {
    return { ...prev, tape, head, halted: true, activeRead: sym, wrote: null };
  }
  tape[head] = rule.write;
  const nextHead = rule.move === "L" ? head - 1 : rule.move === "R" ? head + 1 : head;
  return {
    tape,
    head: nextHead,
    state: rule.next,
    steps: prev.steps + 1,
    halted: rule.next === p.halt,
    activeRead: sym,
    wrote: head,
  };
}

/* ============================================================
   HAMMING(7,4) — bit layout p1 p2 d1 p3 d2 d3 d4 (positions 1..7)
   ============================================================ */
const HAMMING_LABELS = ["p1", "p2", "d1", "p3", "d2", "d3", "d4"];
const HAMMING_KIND: ("p" | "d")[] = ["p", "p", "d", "p", "d", "d", "d"];

/** Given 7 bits (positions 1..7), recompute the 3 parity bits in place. */
function encodeHamming(bits: number[]): number[] {
  const b = bits.slice();
  // parity bit covers positions whose index has that bit set
  b[0] = b[2] ^ b[4] ^ b[6]; // p1 (1) covers 3,5,7
  b[1] = b[2] ^ b[5] ^ b[6]; // p2 (2) covers 3,6,7
  b[3] = b[4] ^ b[5] ^ b[6]; // p3 (4) covers 5,6,7
  return b;
}

/** Returns the 1-based syndrome position (0 = no error). */
function syndrome(bits: number[]): number {
  const s1 = bits[0] ^ bits[2] ^ bits[4] ^ bits[6];
  const s2 = bits[1] ^ bits[2] ^ bits[5] ^ bits[6];
  const s3 = bits[3] ^ bits[4] ^ bits[5] ^ bits[6];
  return s1 * 1 + s2 * 2 + s3 * 4;
}

export default function TuringTape() {
  const { lang } = useLang();

  /* ---------------- Sub-panel A state ---------------- */
  const [progIdx, setProgIdx] = useState(0);
  const program = PROGRAMS[progIdx];
  const [tm, setTm] = useState<TMState>(() => initTM(PROGRAMS[0]));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(5); // 1..10
  const tmRef = useRef(tm);
  tmRef.current = tm;

  const reset = useCallback(
    (idx: number) => {
      setRunning(false);
      setTm(initTM(PROGRAMS[idx]));
    },
    []
  );

  const doStep = useCallback(() => {
    setTm((prev) => stepTM(prev, PROGRAMS[progIdx]));
  }, [progIdx]);

  // run loop via setInterval — cleaned up on unmount / dependency change
  useEffect(() => {
    if (!running) return;
    const delay = 720 - speed * 64; // 656ms .. 80ms
    const id = window.setInterval(() => {
      const cur = tmRef.current;
      if (cur.halted) {
        setRunning(false);
        return;
      }
      setTm((prev) => stepTM(prev, PROGRAMS[progIdx]));
    }, delay);
    return () => window.clearInterval(id);
  }, [running, speed, progIdx]);

  useEffect(() => {
    if (tm.halted) setRunning(false);
  }, [tm.halted]);

  // windowed view of the tape around the head (15 cells)
  const WINDOW = 15;
  const half = Math.floor(WINDOW / 2);
  const cells = useMemo(() => {
    const out: { sym: string; idx: number }[] = [];
    for (let i = tm.head - half; i <= tm.head + half; i++) {
      out.push({ sym: tm.tape[i] ?? program.blank, idx: i });
    }
    return out;
  }, [tm.tape, tm.head, half, program.blank]);

  const stateLabel = program.states.find((s) => s.id === tm.state)?.label ?? {
    en: tm.state,
    zh: tm.state,
  };

  /* ---------------- Sub-panel B state ---------------- */
  const [data, setData] = useState([1, 0, 1, 1]); // d1..d4
  const baseCodeword = useMemo(() => {
    const seven = [0, 0, data[0], 0, data[1], data[2], data[3]];
    return encodeHamming(seven);
  }, [data]);
  const [received, setReceived] = useState<number[]>(baseCodeword);
  const [corrected, setCorrected] = useState(0);
  const [lastFixed, setLastFixed] = useState<number | null>(null);

  // when the data bits change, re-seed the clean received codeword
  useEffect(() => {
    setReceived(baseCodeword);
    setLastFixed(null);
  }, [baseCodeword]);

  const synd = syndrome(received);
  const errorIdx = synd === 0 ? -1 : synd - 1; // 0-based

  const flipBit = (i: number) => {
    setReceived((prev) => {
      const next = prev.slice();
      next[i] = next[i] ^ 1;
      return next;
    });
    setLastFixed(null);
  };

  const injectRandom = () => {
    const i = Math.floor(Math.random() * 7);
    setReceived((prev) => {
      const next = prev.slice();
      next[i] = next[i] ^ 1;
      return next;
    });
    setLastFixed(null);
  };

  const correct = () => {
    const s = syndrome(received);
    if (s === 0) return;
    setReceived((prev) => {
      const next = prev.slice();
      next[s - 1] = next[s - 1] ^ 1;
      return next;
    });
    setCorrected((c) => c + 1);
    setLastFixed(s - 1);
  };

  const toggleData = (i: number) => {
    setData((prev) => {
      const next = prev.slice();
      next[i] = next[i] ^ 1;
      return next;
    });
  };

  return (
    <div className="w-full space-y-10">
      {/* ===================== SUB-PANEL A ===================== */}
      <div className="holo rounded-2xl p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-mono">A · {lang === "zh" ? "图灵机" : "TURING MACHINE"}</div>
            <h3 className="display mt-1 text-xl text-ghost-50">
              <T v={{ en: "Symbols, rules, memory", zh: "符号、规则、记忆" }} />
            </h3>
          </div>
          {/* program menu */}
          <div className="flex flex-wrap gap-2">
            {PROGRAMS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setProgIdx(i);
                  reset(i);
                }}
                className={`label-mono rounded-full border px-3 py-1.5 transition ${
                  i === progIdx
                    ? "border-signal-500/60 bg-signal-500/15 text-signal-300"
                    : "border-void-500/60 text-ghost-500 hover:border-signal-500/40 hover:text-signal-400"
                }`}
              >
                <T v={p.name} />
              </button>
            ))}
          </div>
        </div>

        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ghost-300">
          <T v={program.blurb} />
        </p>

        {/* the tape */}
        <div className="relative overflow-hidden rounded-xl border border-void-600/70 bg-void-900/60 px-3 py-7 dot-bg">
          {/* head marker */}
          <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 text-center">
            <div className="flux-text mono text-[0.6rem]">▼ {lang === "zh" ? "读写头" : "HEAD"}</div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {cells.map((c) => {
              const isHead = c.idx === tm.head;
              const justWrote = c.idx === tm.wrote;
              const blank = c.sym === program.blank;
              return (
                <div
                  key={c.idx}
                  className={`mono flex h-12 w-9 shrink-0 items-center justify-center rounded-md border text-base transition-all duration-200 sm:h-14 sm:w-11 sm:text-lg ${
                    isHead
                      ? "border-flux-500 bg-flux-500/15 text-flux-300 shadow-glowflux scale-110"
                      : justWrote
                        ? "border-wire-500/70 bg-wire-500/10 text-wire-300"
                        : blank
                          ? "border-void-600/60 text-ghost-700"
                          : "border-signal-500/40 bg-signal-500/5 text-signal-300"
                  }`}
                >
                  {c.sym}
                </div>
              );
            })}
          </div>
          {/* faint cell-index ruler */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {cells.map((c) => (
              <div
                key={c.idx}
                className="mono w-9 shrink-0 text-center text-[0.55rem] text-ghost-700 sm:w-11"
              >
                {c.idx}
              </div>
            ))}
          </div>
        </div>

        {/* status + controls */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_minmax(0,18rem)]">
          {/* transition table */}
          <div>
            <div className="label-mono mb-2">{lang === "zh" ? "转移表 δ" : "TRANSITION TABLE δ"}</div>
            <div className="overflow-hidden rounded-lg border border-void-600/70">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-void-800/70 text-[0.6rem] text-ghost-500">
                    <th className="label-mono px-3 py-2">{lang === "zh" ? "状态" : "STATE"}</th>
                    <th className="label-mono px-2 py-2">{lang === "zh" ? "读" : "READ"}</th>
                    <th className="label-mono px-2 py-2">{lang === "zh" ? "写" : "WRITE"}</th>
                    <th className="label-mono px-2 py-2">{lang === "zh" ? "移" : "MOVE"}</th>
                    <th className="label-mono px-3 py-2">{lang === "zh" ? "下一状态" : "NEXT"}</th>
                  </tr>
                </thead>
                <tbody className="mono text-[0.78rem]">
                  {Object.entries(program.table).flatMap(([st, rules]) =>
                    rules.map((r, ri) => {
                      const isActive =
                        !tm.halted &&
                        st === tm.state &&
                        tm.activeRead !== null &&
                        r.read === tm.activeRead;
                      // also highlight the row that WILL fire next when paused
                      const willFire =
                        !running &&
                        !tm.halted &&
                        st === tm.state &&
                        r.read === (tm.tape[tm.head] ?? program.blank);
                      return (
                        <tr
                          key={`${st}-${ri}`}
                          className={`border-t border-void-700/50 transition-colors ${
                            willFire
                              ? "bg-wire-500/15 text-wire-200"
                              : isActive
                                ? "bg-wire-500/10 text-wire-300"
                                : "text-ghost-300"
                          }`}
                        >
                          <td className="px-3 py-1.5">
                            <span className={st === tm.state ? "signal-text" : "text-ghost-500"}>
                              {st}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">{r.read}</td>
                          <td className="px-2 py-1.5 text-signal-300">{r.write}</td>
                          <td className="px-2 py-1.5 text-flux-300">{r.move}</td>
                          <td className="px-3 py-1.5 text-wire-300">{r.next}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* live readout + controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-void-600/70 bg-void-900/50 px-3 py-2.5">
                <div className="label-mono">{lang === "zh" ? "当前状态" : "STATE"}</div>
                <div className="mono mt-1 text-sm signal-text">
                  <T v={stateLabel} />
                </div>
              </div>
              <div className="rounded-lg border border-void-600/70 bg-void-900/50 px-3 py-2.5">
                <div className="label-mono">{lang === "zh" ? "步数" : "STEPS"}</div>
                <div className="mono mt-1 text-sm text-flux-300">
                  {tm.steps}
                  {tm.halted && (
                    <span className="ml-2 text-[0.62rem] text-signal-400">
                      {lang === "zh" ? "● 停机" : "● HALTED"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                disabled={tm.halted}
                className={`label-mono flex-1 rounded-md border px-3 py-2 transition disabled:opacity-30 ${
                  running
                    ? "border-pulse-500/60 bg-pulse-500/15 text-pulse-300"
                    : "border-signal-500/60 bg-signal-500/15 text-signal-300 hover:bg-signal-500/25"
                }`}
              >
                {running ? (lang === "zh" ? "暂停" : "PAUSE") : lang === "zh" ? "运行" : "RUN"}
              </button>
              <button
                onClick={doStep}
                disabled={running || tm.halted}
                className="label-mono flex-1 rounded-md border border-wire-500/50 px-3 py-2 text-wire-300 transition hover:bg-wire-500/15 disabled:opacity-30"
              >
                {lang === "zh" ? "单步" : "STEP"}
              </button>
              <button
                onClick={() => reset(progIdx)}
                className="label-mono flex-1 rounded-md border border-void-500/70 px-3 py-2 text-ghost-300 transition hover:border-ghost-300/50"
              >
                {lang === "zh" ? "重置" : "RESET"}
              </button>
            </div>

            <div>
              <div className="label-mono mb-1.5 flex justify-between">
                <span>{lang === "zh" ? "速度" : "SPEED"}</span>
                <span className="text-flux-300">{speed}×</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-void-600 accent-signal-500"
              />
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ghost-500">
          <T
            v={{
              en: "A Turing machine is the minimal definition of “what is computable” — symbols on a tape, a finite table of rules, and a movable head. Memory + rules + symbols = universal computation. Every algorithm you have ever run is some elaboration of this 1936 idea.",
              zh: "图灵机是「何为可计算」的最小定义——纸带上的符号、有限的规则表、可移动的读写头。记忆 + 规则 + 符号 = 通用计算。你运行过的每一个算法，都是这个 1936 年构想的某种展开。",
            }}
          />
        </p>
      </div>

      {/* ===================== SUB-PANEL B ===================== */}
      <div className="holo rounded-2xl p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-mono">B · {lang === "zh" ? "纠错码" : "ERROR CORRECTION"}</div>
            <h3 className="display mt-1 text-xl text-ghost-50">
              <T v={{ en: "Hamming(7,4) · surviving noise", zh: "汉明(7,4)·穿越噪声" }} />
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-void-600/70 bg-void-900/50 px-3 py-1.5">
              <span className="label-mono">{lang === "zh" ? "已纠正" : "CORRECTED"}</span>
              <span className="mono ml-2 text-sm text-signal-300">{corrected}</span>
            </div>
          </div>
        </div>

        {/* data-bit editor */}
        <div className="mb-5">
          <div className="label-mono mb-2">
            {lang === "zh" ? "4 个数据位 — 点击翻转" : "4 DATA BITS — CLICK TO SET"}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.map((b, i) => (
              <button
                key={i}
                onClick={() => toggleData(i)}
                className="mono flex h-10 w-12 items-center justify-center rounded-md border border-signal-500/40 bg-signal-500/5 text-base text-signal-300 transition hover:bg-signal-500/15"
              >
                {b}
              </button>
            ))}
            <span className="self-center text-xs text-ghost-500">
              <T v={{ en: "d1 d2 d3 d4", zh: "d1 d2 d3 d4" }} />
            </span>
          </div>
        </div>

        {/* the 7-bit codeword */}
        <div className="rounded-xl border border-void-600/70 bg-void-900/60 px-3 py-6 grid-bg">
          <div className="label-mono mb-3 text-center">
            {lang === "zh"
              ? "收到的 7 位码字 — 点击任意位模拟信道噪声"
              : "RECEIVED 7-BIT CODEWORD — CLICK ANY BIT TO INJECT NOISE"}
          </div>
          <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-3">
            {received.map((b, i) => {
              const isError = i === errorIdx;
              const wasFixed = i === lastFixed && synd === 0;
              const isParity = HAMMING_KIND[i] === "p";
              return (
                <button
                  key={i}
                  onClick={() => flipBit(i)}
                  className="group flex flex-col items-center gap-1.5"
                  title={HAMMING_LABELS[i]}
                >
                  <span
                    className={`mono text-[0.6rem] ${
                      isParity ? "text-flux-400" : "text-signal-400"
                    }`}
                  >
                    {HAMMING_LABELS[i]}
                  </span>
                  <span
                    className={`mono flex h-12 w-10 items-center justify-center rounded-md border text-lg transition-all duration-200 sm:h-14 sm:w-12 ${
                      isError
                        ? "border-pulse-500 bg-pulse-500/20 text-pulse-300 shadow-glowpulse glow-pulse scale-110"
                        : wasFixed
                          ? "border-signal-500 bg-signal-500/20 text-signal-300 shadow-glow"
                          : isParity
                            ? "border-flux-500/50 bg-flux-500/5 text-flux-300 group-hover:bg-flux-500/15"
                            : "border-signal-500/50 bg-signal-500/5 text-signal-300 group-hover:bg-signal-500/15"
                    }`}
                  >
                    {b}
                  </span>
                  <span className="mono text-[0.55rem] text-ghost-700">{i + 1}</span>
                </button>
              );
            })}
          </div>

          {/* syndrome readout */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
            <div>
              <span className="label-mono">{lang === "zh" ? "校验子" : "SYNDROME"}</span>
              <span className="mono ml-2 text-sm text-wire-300">{synd.toString(2).padStart(3, "0")}</span>
              <span className="mono ml-1 text-xs text-ghost-500">(= {synd})</span>
            </div>
            <div className="h-4 w-px bg-void-500" />
            <div>
              {synd === 0 ? (
                <span className="mono text-sm signal-text">
                  {lang === "zh" ? "✓ 无错误 — 码字有效" : "✓ NO ERROR — codeword valid"}
                </span>
              ) : (
                <span className="mono text-sm pulse-text">
                  {lang === "zh"
                    ? `⚠ 第 ${synd} 位出错`
                    : `⚠ ERROR AT POSITION ${synd} (${HAMMING_LABELS[synd - 1]})`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={injectRandom}
            className="label-mono rounded-md border border-pulse-500/50 px-4 py-2 text-pulse-300 transition hover:bg-pulse-500/15"
          >
            {lang === "zh" ? "注入随机错误" : "INJECT RANDOM ERROR"}
          </button>
          <button
            onClick={correct}
            disabled={synd === 0}
            className="label-mono rounded-md border border-signal-500/60 bg-signal-500/15 px-4 py-2 text-signal-300 transition hover:bg-signal-500/25 disabled:opacity-30"
          >
            {lang === "zh" ? "纠正错误" : "CORRECT IT"}
          </button>
          <button
            onClick={() => {
              setReceived(baseCodeword);
              setLastFixed(null);
            }}
            className="label-mono rounded-md border border-void-500/70 px-4 py-2 text-ghost-300 transition hover:border-ghost-300/50"
          >
            {lang === "zh" ? "复位码字" : "RESET CODEWORD"}
          </button>
        </div>

        {/* parity-equation legend */}
        <div className="mt-5 grid gap-2 text-xs text-ghost-500 sm:grid-cols-3">
          <div className="rounded-lg border border-void-600/60 bg-void-900/40 px-3 py-2">
            <span className="flux-text mono">p1</span> = d1 ⊕ d2 ⊕ d4
          </div>
          <div className="rounded-lg border border-void-600/60 bg-void-900/40 px-3 py-2">
            <span className="flux-text mono">p2</span> = d1 ⊕ d3 ⊕ d4
          </div>
          <div className="rounded-lg border border-void-600/60 bg-void-900/40 px-3 py-2">
            <span className="flux-text mono">p3</span> = d2 ⊕ d3 ⊕ d4
          </div>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ghost-500">
          <T
            v={{
              en: "Error-correcting codes are why information survives transmission and storage. Three parity bits over four data bits build a structure where any single flipped bit announces its own position in the syndrome — so the receiver repairs it without asking for a resend. The same redundancy guards deep-space probes, QR codes, RAM, and DNA.",
              zh: "纠错码，是信息得以在传输与存储中幸存的原因。四个数据位之上叠加三个校验位，构成一种结构：任何单个翻转的比特都会在校验子中暴露自己的位置——接收方无需重传即可修复。同样的冗余，守护着深空探测器、二维码、内存芯片，乃至 DNA。",
            }}
          />
        </p>
      </div>
    </div>
  );
}
