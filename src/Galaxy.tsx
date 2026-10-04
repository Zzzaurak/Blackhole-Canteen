import { useEffect, useRef } from "react";
import { canteens } from "./data";
import { isOpen } from "./engine";
import type { Canteen } from "./types";
import StarBody from "./StarBody";

interface Props {
  paused: boolean;
  inArm: boolean;
  time: string;
  activeCanteenId: string | null;
  celebrating: boolean;
  onInspect: (canteen: Canteen) => void;
}
// Local visual positions only. Neither geography nor probabilities use these.
const anchors = [
  [0.24, 0.36],
  [0.7, 0.31],
  [0.78, 0.62],
  [0.46, 0.18],
  [0.53, 0.78],
  [0.11, 0.68],
  [0.9, 0.22],
  [0.19, 0.17],
  [0.86, 0.83],
];
const wrap = (value: number, extent: number) =>
  ((value % extent) + extent) % extent;

/** A camera following the mascot through a tiny patch INSIDE the galaxy. */
export default function Galaxy(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = useRef(props);
  const wake = useRef<(() => void) | null>(null);
  const elapsed = useRef(0);
  const hovered = useRef<string | null>(null);
  useEffect(() => {
    current.current = props;
    wake.current?.();
  }, [props]);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0,
      height = 0,
      frame = 0,
      previous = 0;
    let arm = current.current.inArm ? 1 : 0;
    let seed = 613;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const stars = Array.from({ length: 820 }, (_, i) => ({
      x: random(),
      y: random(),
      size: random(),
      depth: 0.2 + random() * 0.8,
      phase: random() * Math.PI * 2,
      type: i % canteens.length,
      inCloud: i >= 170,
    }));
    const nodes = anchors.map(() => ({ travel: 0, focus: 0 }));
    // Cloud textures and stellar halos are pre-rendered once, not rebuilt every frame.
    const nebula = document.createElement("canvas");
    nebula.width = 1200;
    nebula.height = 900;
    const cloud = nebula.getContext("2d")!;
    for (let i = 0; i < 100; i++) {
      const x = random() * 1500 - 150,
        y = 760 - x * 0.5 + (random() - 0.5) * 160;
      const radius = 60 + random() * 180;
      const color = ["107,90,172", "74,109,154", "163,99,164", "187,150,111"][
        i % 4
      ];
      const gradient = cloud.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color},${0.035 + random() * 0.07})`);
      gradient.addColorStop(0.5, `rgba(${color},.025)`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      cloud.fillStyle = gradient;
      cloud.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    const sprites = canteens.map((c) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 80;
      const s = sprite.getContext("2d")!;
      const glow = s.createRadialGradient(40, 40, 0, 40, 40, 40);
      glow.addColorStop(0, "#fff7e9");
      glow.addColorStop(0.08, c.color);
      glow.addColorStop(0.22, `${c.color}90`);
      glow.addColorStop(0.5, `${c.color}18`);
      glow.addColorStop(1, `${c.color}00`);
      s.fillStyle = glow;
      s.fillRect(0, 0, 80, 80);
      return sprite;
    });
    const render = (now: number) => {
      frame = 0;
      const { paused, inArm, activeCanteenId } = current.current;
      const dt = previous ? Math.min(now - previous, 48) : 16;
      previous = now;
      if (!paused && !document.hidden) elapsed.current += dt;
      const blend = paused ? 1 : 1 - Math.exp(-dt / 650);
      arm += ((inArm ? 1 : 0) - arm) * blend;
      const seconds = elapsed.current / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#080c17";
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.25 + arm * 0.85;
      // At mealtimes the arm surrounds us. Between meals its distant edge lies beyond the view.
      ctx.drawImage(
        nebula,
        -width * 0.15 + Math.sin(seconds * 0.015) * width * 0.025,
        -height * 0.08 - (1 - arm) * height * 0.92,
        width * 1.3,
        height * 1.18,
      );
      ctx.restore();
      for (const star of stars) {
        const speed = 1.5 + star.depth * 5;
        const x =
          wrap(star.x * (width + 60) - seconds * speed * 0.4, width + 60) - 30;
        const y =
          wrap(star.y * (height + 60) + seconds * speed, height + 60) - 30;
        const edge = Math.max(
          0,
          Math.min(1, x / 30, (width - x) / 30, y / 30, (height - y) / 30),
        );
        const band = Math.exp(
          -Math.pow((y / height - (0.84 - (0.54 * x) / width)) / 0.24, 2),
        );
        const opacity =
          edge * (star.inCloud ? arm * band * 0.68 : 0.5 + star.depth * 0.35);
        if (opacity < 0.015) continue;
        ctx.globalAlpha =
          opacity * (0.8 + 0.2 * Math.sin(seconds * 0.6 + star.phase));
        if (star.size > 0.82 && !star.inCloud) {
          const diameter = 10 + star.size * 13;
          ctx.drawImage(
            sprites[star.type],
            x - diameter / 2,
            y - diameter / 2,
            diameter,
            diameter,
          );
          if (star.size > 0.96) {
            ctx.strokeStyle = canteens[star.type].color;
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(x - 5, y);
            ctx.lineTo(x + 5, y);
            ctx.moveTo(x, y - 5);
            ctx.lineTo(x, y + 5);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle =
            star.type % 3 === 0
              ? "#eed5b2"
              : star.type % 3 === 1
                ? "#c4d6f1"
                : "#cec0e4";
          ctx.beginPath();
          ctx.arc(x, y, 0.35 + star.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < canteens.length; i++) {
        const element = nodeRefs.current[i];
        if (!element) continue;
        const target = canteens[i].id === activeCanteenId,
          node = nodes[i];
        const hold =
          hovered.current === canteens[i].id ||
          document.activeElement === element;
        if (!paused && !document.hidden && !hold) node.travel += dt / 1000;
        node.focus +=
          ((target ? 1 : 0) - node.focus) *
          (paused ? 1 : 1 - Math.exp(-dt / 430));
        const x =
          wrap(
            anchors[i][0] * (width + 100) - node.travel * (1.5 + i * 0.14),
            width + 100,
          ) - 50;
        const y =
          wrap(
            anchors[i][1] * (height + 100) + node.travel * (3.1 + i * 0.12),
            height + 100,
          ) - 50;
        const px = x + (width * (width < 500 ? 0.75 : 0.65) - x) * node.focus,
          py = y + (height * (width < 500 ? 0.36 : 0.44) - y) * node.focus;
        const edge = Math.max(
          0,
          Math.min(
            1,
            px / 35,
            (width - px) / 35,
            py / 60,
            (height - py - 40) / 35,
          ),
        );
        element.style.left = `${px}px`;
        element.style.top = `${py}px`;
        element.style.opacity = String(hold || target ? 1 : 0.4 + edge * 0.6);
        element.style.setProperty(
          "--approach-scale",
          String(1 + node.focus * 0.55),
        );
      }
      if (!paused && !document.hidden) frame = requestAnimationFrame(render);
    };
    const resume = () => {
      if (!frame) {
        previous = 0;
        frame = requestAnimationFrame(render);
      }
    };
    wake.current = resume;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resume();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", resume);
      wake.current = null;
    };
  }, []);
  return (
    <>
      <canvas ref={canvasRef} className="galaxy-canvas" aria-hidden="true" />
      {canteens.map((c, i) => (
        <button
          key={c.id}
          ref={(element) => {
            nodeRefs.current[i] = element;
          }}
          className={`star-node drifting-star ${props.activeCanteenId === c.id ? "target" : ""} ${!isOpen(c, props.time) ? "closed" : ""} ${props.celebrating && props.activeCanteenId === c.id ? "consumed" : ""}`}
          style={{
            left: `${anchors[i][0] * 100}%`,
            top: `${anchors[i][1] * 100}%`,
          }}
          aria-label={`查看${c.name}，${c.star}`}
          onPointerEnter={() => {
            hovered.current = c.id;
          }}
          onPointerLeave={() => {
            hovered.current = null;
          }}
          onClick={() => props.onInspect(c)}
        >
          <StarBody canteen={c} />
          <span className="star-label">
            {c.name}
            <small>{c.star}</small>
          </span>
        </button>
      ))}
    </>
  );
}
