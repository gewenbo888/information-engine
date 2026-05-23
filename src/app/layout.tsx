import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

const TITLE_EN =
  "Information Engine · The Nature of Information, Computation, Communication, Intelligence & Reality";
const TITLE_ZH = "信息引擎 · 信息、计算、通信、智能与现实的本质";
const DESC =
  "A civilization-scale, bilingual exploration of information itself — from bits, DNA and language to computation, networks, cryptography, AI embeddings and quantum information. The thesis: civilization is the history of information becoming denser, faster, more abstract and more networked — and information may be one of the deepest substrates from which matter, life, intelligence and reality emerge.";

export const metadata: Metadata = {
  metadataBase: new URL("https://information-engine.psyverse.fun"),
  title: `${TITLE_EN} | ${TITLE_ZH}`,
  description: DESC,
  keywords: [
    "information", "information theory", "Shannon entropy", "bits", "computation", "communication",
    "Turing machine", "algorithms", "compression", "error correction", "DNA information", "genetic code",
    "neural signals", "writing systems", "symbolic systems", "language", "mathematics", "cryptography",
    "blockchain", "consensus", "zero-knowledge proofs", "Psy Protocol", "internet protocols",
    "AI embeddings", "large language models", "quantum information", "qubits", "entanglement",
    "holographic principle", "black hole information paradox", "memetics", "collective intelligence",
    "networks", "entropy", "intelligence as compression", "digital physics", "it from bit",
    "信息", "信息论", "香农熵", "比特", "计算", "通信", "图灵机", "压缩", "纠错码", "DNA 信息",
    "遗传密码", "神经信号", "符号系统", "语言", "密码学", "区块链", "共识", "零知识证明",
    "嵌入向量", "大语言模型", "量子信息", "量子比特", "纠缠", "全息原理", "模因", "集体智能",
  ],
  authors: [{ name: "Gewenbo", url: "https://psyverse.fun" }],
  alternates: { canonical: "/", languages: { en: "/", "zh-CN": "/", "x-default": "/" } },
  openGraph: {
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Information Engine · 信息引擎 — The Nature of Information, Computation & Reality" }],
    title: TITLE_EN,
    description:
      "From bits to DNA to embeddings to qubits. A bilingual atlas of information — entropy, language, computation, networks, cryptography, AI, quantum information, memetics, and the informational structure of reality itself.",
    url: "https://information-engine.psyverse.fun/",
    siteName: "Psyverse",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    images: ["/twitter-image.png"],
    card: "summary_large_image",
    title: TITLE_EN,
    description: "Information may not merely describe reality — it may be the substrate from which reality, life and intelligence emerge. A bilingual exploration.",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#04070d" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: TITLE_EN,
              alternateName: TITLE_ZH,
              description: DESC,
              url: "https://information-engine.psyverse.fun/",
              inLanguage: ["en", "zh-CN"],
              author: { "@type": "Person", name: "Gewenbo", url: "https://psyverse.fun/" },
              publisher: { "@type": "Organization", name: "Psyverse", url: "https://psyverse.fun/" },
            }),
          }}
        />
      </head>
      <body className="bg-void-950 text-ghost-100 antialiased">
        {children}
        <Script src="https://analytics-dashboard-two-blue.vercel.app/tracker.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
