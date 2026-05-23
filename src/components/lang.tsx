"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "zh";
export type Bi = { en: string; zh: string };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/** Pick a string from a bilingual object. */
export function t(b: Bi, lang: Lang) {
  return b[lang];
}

/** Inline bilingual text node that re-renders + fades on toggle. */
export function T({ v, className }: { v: Bi; className?: string }) {
  const { lang } = useLang();
  return (
    <span key={lang} className={`${className ?? ""} ${lang === "zh" ? "zh" : ""} lang-fade`}>
      {v[lang]}
    </span>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center overflow-hidden rounded-full border border-signal-500/30 text-[0.7rem] font-mono">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 transition ${lang === "en" ? "bg-signal-500/20 text-signal-300" : "text-ghost-500 hover:text-signal-400"}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <span className="text-ghost-500/40">|</span>
      <button
        onClick={() => setLang("zh")}
        className={`px-3 py-1 transition ${lang === "zh" ? "bg-signal-500/20 text-signal-300" : "text-ghost-500 hover:text-signal-400"}`}
        aria-pressed={lang === "zh"}
      >
        中文
      </button>
    </div>
  );
}
