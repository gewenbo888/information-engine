"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background: a living information field.
 * - A graph of nodes connected by faint wires.
 * - Packets (glowing dots) flow along edges.
 * - 0/1 bits drift upward like rising data.
 * Pure Canvas 2D, SSR-safe, cleans up on unmount.
 */
export default function InfoCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canvas: HTMLCanvasElement = el;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const parent = canvas.parentElement!;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: string };
    type Edge = { a: number; b: number };
    type Packet = { e: number; t: number; speed: number; col: string };
    type Bit = { x: number; y: number; v: string; a: number; spd: number; col: string };

    const COLORS = ["#23e6b3", "#2fc6f5", "#ff4da6", "#f5b338"];
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let packets: Packet[] = [];
    let bits: Bit[] = [];

    function build() {
      const count = Math.max(26, Math.min(60, Math.round((w * h) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.6 + 1,
        hue: COLORS[(Math.random() * COLORS.length) | 0],
      }));
      // connect each node to a few nearest neighbours
      edges = [];
      const seen = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const dists = nodes
          .map((n, j) => ({ j, d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        for (const { j } of dists) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({ a: i, b: j });
          }
        }
      }
      packets = Array.from({ length: Math.min(40, edges.length) }, () => ({
        e: (Math.random() * edges.length) | 0,
        t: Math.random(),
        speed: Math.random() * 0.006 + 0.003,
        col: COLORS[(Math.random() * COLORS.length) | 0],
      }));
      bits = Array.from({ length: Math.round(w / 26) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        v: Math.random() > 0.5 ? "1" : "0",
        a: Math.random() * 0.4 + 0.05,
        spd: Math.random() * 0.25 + 0.08,
        col: Math.random() > 0.6 ? "#5cf2cc" : "#1d3450",
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    let raf = 0;
    function frame() {
      ctx.clearRect(0, 0, w, h);

      // drifting bits
      ctx.font = "11px 'IBM Plex Mono', monospace";
      for (const b of bits) {
        b.y -= b.spd;
        if (b.y < -12) {
          b.y = h + 12;
          b.x = Math.random() * w;
          b.v = Math.random() > 0.5 ? "1" : "0";
        }
        ctx.globalAlpha = b.a;
        ctx.fillStyle = b.col;
        ctx.fillText(b.v, b.x, b.y);
      }
      ctx.globalAlpha = 1;

      // move nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // edges
      ctx.lineWidth = 0.6;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const alpha = Math.max(0, 0.18 - d / 2600);
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(92, 242, 204, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.fillStyle = n.hue;
        ctx.globalAlpha = 0.85;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // packets
      for (const p of packets) {
        const e = edges[p.e];
        if (!e) continue;
        const a = nodes[e.a];
        const b = nodes[e.b];
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.e = (Math.random() * edges.length) | 0;
          p.col = COLORS[(Math.random() * COLORS.length) | 0];
        }
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
        g.addColorStop(0, p.col);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
