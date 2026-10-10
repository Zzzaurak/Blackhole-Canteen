import { useEffect, useRef } from "react";
import { canteens } from "./data";
import { isOpen } from "./engine";
import type { Canteen } from "./types";
import StarBody from "./StarBody";
import { getSpiralField, fieldCamera, drawFieldGas } from "./spiralField";

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
    const field = getSpiralField();
    const nodes = anchors.map(() => ({ travel: 0, focus: 0, fade: 1 }));
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
      const blend = paused ? 1 : 1 - Math.exp(-dt / 4000);
      arm += ((inArm ? 1 : 0) - arm) * blend;
      const seconds = elapsed.current / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#080c17";
      ctx.fillRect(0, 0, width, height);
      const camera = fieldCamera(width, height, seconds);
      // No wipe or flying-in cloud sheet: the existing field gently changes
      // illumination at mealtimes, with positions remaining continuous.
      ctx.globalAlpha = 0.12 + arm * 0.88;
      drawFieldGas(ctx, field.gas, width, height, camera);
      for (const star of field.stars) {
        const x = (star.x - camera.x) * camera.scale + width / 2;
        const y = (star.y - camera.y) * camera.scale + height / 2;
        if (x < -12 || y < -12 || x > width + 12 || y > height + 12) continue;
        ctx.globalAlpha = star.brightness * (0.2 + arm * 0.8);
        if (star.size > 0.986) {
          const diameter = 8 + star.size * 6;
          ctx.drawImage(sprites[star.color], x - diameter / 2, y - diameter / 2, diameter, diameter);
        } else {
          // Preserve colored light even for unresolved stars; no additive white clipping.
          ctx.fillStyle = canteens[star.color].color;
          ctx.beginPath();
          ctx.arc(x, y, 0.35 + star.size * 0.65, 0, Math.PI * 2);
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
        const destination = target ? 1 : 0;
        if (paused) {
          node.focus = destination;
          node.fade = 1;
        } else if (node.focus !== destination) {
          node.fade = Math.max(0, node.fade - dt / 260);
          // Both arrival and return change position only on a fully invisible frame.
          if (node.fade === 0) node.focus = destination;
        } else {
          node.fade = Math.min(1, node.fade + dt / 420);
        }
        if (!paused && !document.hidden && !hold && !target && node.focus === 0 && node.fade === 1) {
          node.travel += dt / 1000;
        }
        const x =
          wrap(
            anchors[i][0] * (width + 100) - node.travel * (0.42 + i * 0.025),
            width + 100,
          ) - 50;
        const y =
          wrap(
            anchors[i][1] * (height + 100) + node.travel * (1.0 + i * 0.035),
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
        element.style.opacity = String(node.fade * (hold || target ? 1 : 0.4 + edge * 0.6));
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
