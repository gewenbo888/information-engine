import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // deep informational void — near-black with a faint blue-green
        void: {
          950: "#04070d",
          900: "#070c15",
          800: "#0b1320",
          700: "#101c2e",
          600: "#16273d",
          500: "#1d3450",
        },
        // phosphor teal-green — the primary SIGNAL / the bit
        signal: {
          600: "#0fbf95",
          500: "#23e6b3",
          400: "#5cf2cc",
          300: "#9af9e1",
        },
        // amber-gold — energy / entropy / transmission
        flux: {
          600: "#dd9311",
          500: "#f5b338",
          400: "#ffc861",
          300: "#ffdc9a",
        },
        // magenta — quantum / abstraction / noise
        pulse: {
          600: "#d11f86",
          500: "#ff4da6",
          400: "#ff79bf",
          300: "#ffaad6",
        },
        // electric cyan — data / wire / links
        wire: {
          600: "#0c9fd4",
          500: "#2fc6f5",
          400: "#67d8fb",
          300: "#a6e9fd",
        },
        // cool light text on void
        ghost: {
          50: "#eef5f3",
          100: "#dde9e6",
          200: "#bccbc7",
          300: "#90a39e",
          500: "#62736e",
          700: "#3b4945",
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        zh: ['"Noto Sans SC"', "sans-serif"],
      },
      boxShadow: {
        sigcard: "inset 0 1px 0 rgba(92,242,204,0.07), 0 24px 60px -28px rgba(0,0,0,0.92)",
        glow: "0 0 40px -8px rgba(35,230,179,0.55)",
        glowflux: "0 0 36px -8px rgba(245,179,56,0.5)",
        glowpulse: "0 0 36px -8px rgba(255,77,166,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
