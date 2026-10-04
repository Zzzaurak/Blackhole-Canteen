import { useEffect, useRef } from "react";

/** Decorative galaxy coordinates never enter the recommendation engine. */
export default function Galaxy({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let elapsed = 0;
    let previous = 0;
    let seed = 53;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const stars = Array.from({ length: 190 }, () => ({
      x: random(),
      y: random(),
      r: random() * 1.2 + 0.25,
      a: random() * 0.48 + 0.12,
      phase: random() * 6,
    }));
    const dust = Array.from({ length: 2400 }, (_, i) => {
      const t = random();
      const arm = i % 2;
      const jitter = (random() - 0.5) * 0.42;
      const angle = t * 5.2 + arm * Math.PI + jitter;
      const radius = 0.075 + t * 0.39;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.59,
        r: random() * 1.45 + 0.25,
        a: (1 - t) * 0.34 + 0.035,
        warm: random() > 0.69,
      };
    });
    const render = (now: number) => {
      if (previous && !paused) elapsed += Math.min(now - previous, 50);
      previous = now;
      ctx.clearRect(0, 0, width, height);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(217,220,250,${s.a * (0.78 + 0.22 * Math.sin(elapsed / 2000 + s.phase))})`;
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.save();
      ctx.translate(width * 0.51, height * 0.48);
      ctx.rotate(-0.3 + elapsed * 0.000006);
      const unit = Math.min(width, height * 1.48);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, unit * 0.48);
      glow.addColorStop(0, "rgba(178,130,218,.16)");
      glow.addColorStop(0.25, "rgba(119,89,181,.10)");
      glow.addColorStop(1, "rgba(46,31,73,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-unit, -unit, unit * 2, unit * 2);
      dust.forEach((s) => {
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? `rgba(235,197,156,${s.a})`
          : `rgba(174,143,222,${s.a})`;
        ctx.arc(s.x * unit, s.y * unit, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      // The distinct central bar connects both arms of this barred spiral galaxy.
      const bar = ctx.createLinearGradient(-unit * 0.12, 0, unit * 0.12, 0);
      bar.addColorStop(0, "rgba(245,199,160,0)");
      bar.addColorStop(0.5, "rgba(229,190,185,.35)");
      bar.addColorStop(1, "rgba(245,199,160,0)");
      ctx.fillStyle = bar;
      ctx.filter = "blur(9px)";
      ctx.fillRect(-unit * 0.15, -9, unit * 0.3, 18);
      ctx.filter = "none";
      ctx.restore();
      if (!paused) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (paused) render(0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(render);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [paused]);
  return <canvas ref={ref} className="galaxy-canvas" aria-hidden="true" />;
}
