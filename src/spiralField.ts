/** Local top-down window into a shared six-arm world.
 * Gas and stars use exactly the same logarithmic spiral and normal offsets.
 * Inspired by the user's barred_galaxy_drift.html; no runtime CDN dependencies.
 */
const TAU = Math.PI * 2;
const WORLD = 400;
const MAP_SIZE = 3072;
const ARM_COUNT = 6;
const PITCH = 0.3;
const PHASE = -Math.log(90 / 22) / PITCH;
const strengths = [1, 0.6, 0.85, 1, 0.65, 0.8];
export interface FieldStar {
  x: number;
  y: number;
  size: number;
  color: number;
  brightness: number;
}
let cached: ReturnType<typeof createField> | undefined;

function createField() {
  let seed = 613;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(0.00001, random()))) * Math.cos(TAU * random());
  // Smooth Gaussian tails replace the reference's hard, uniform-width cutoff.
  const sampleArm = (arm: number, radius: number, spread: number) => {
    const theta = Math.log(radius / 22) / PITCH + PHASE + arm * TAU / ARM_COUNT;
    const c = Math.cos(theta), s = Math.sin(theta);
    const length = Math.sqrt(1 + PITCH * PITCH);
    return {
      x: radius * c + spread * (c + PITCH * s) / length,
      y: radius * s + spread * (s - PITCH * c) / length,
    };
  };
  const gas = document.createElement("canvas");
  gas.width = gas.height = MAP_SIZE;
  const ctx = gas.getContext("2d")!;
  const tones = ["155,97,202", "195,111,166", "80,139,190", "117,105,186"];
  const puffs = tones.map((color) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const c = canvas.getContext("2d")!;
    const gradient = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${color},.5)`);
    gradient.addColorStop(0.25, `rgba(${color},.3)`);
    gradient.addColorStop(0.55, `rgba(${color},.09)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = gradient;
    c.fillRect(0, 0, 128, 128);
    return canvas;
  });
  const scale = MAP_SIZE / WORLD;
  // Large translucent envelopes + smaller, irregular cloud complexes.
  // Gas spreads farther than the stellar ridge, but has the same centreline.
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 6500; i++) {
    const arm = i % ARM_COUNT;
    const r = 25 + random() * 154;
    const broad = i % 3 === 0;
    const point = sampleArm(arm, r, normal() * (broad ? 8 : 3.8));
    const radius = (broad ? 17 + random() * 13 : 5 + random() * 9) * scale;
    const x = (point.x + WORLD / 2) * scale;
    const y = (point.y + WORLD / 2) * scale;
    const complexity = 0.65 + 0.35 * Math.sin(r * 0.32 + arm * 2);
    ctx.globalAlpha = (broad ? 0.08 : 0.18) * strengths[arm] * complexity;
    ctx.drawImage(puffs[i % tones.length], x - radius, y - radius, radius * 2, radius * 2);
  }
  // Smaller loose complexes sit within the broad haze, with no hard shell.
  // Each complex is assembled from scattered soft puffs rather than one circle.
  for (let i = 0; i < 780; i++) {
    const arm = i % ARM_COUNT;
    const radius = 26 + random() * 150;
    const spread = normal() * 3.5;
    const tone = Math.floor(random() * tones.length);
    for (let j = 0; j < 9; j++) {
      const point = sampleArm(arm, radius + normal() * 0.7, spread + normal() * 1.1);
      const size = (0.8 + random() * 2.6) * scale;
      ctx.globalAlpha = 0.14 * strengths[arm];
      ctx.drawImage(puffs[tone], (point.x + WORLD / 2) * scale - size,
        (point.y + WORLD / 2) * scale - size, size * 2, size * 2);
    }
  }
  const stars: FieldStar[] = [];
  for (let i = 0; i < 68000; i++) {
    const arm = i % ARM_COUNT;
    const inDisc = i % 5 === 0;
    const radius = 22 + random() * 158;
    const angle = random() * TAU;
    const point = inDisc
      ? { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
      : sampleArm(arm, radius, normal() * (3.7 + random() * 3.5));
    stars.push({
      ...point,
      size: random(),
      color: Math.floor(random() * 9),
      brightness: (0.2 + random() * 0.65) * (inDisc ? 0.6 : strengths[arm]),
    });
  }
  return { gas, stars };
}

export function getSpiralField() {
  return cached ??= createField();
}

/** Fixed close-up scale excludes the nucleus and the complete galactic disc. */
export function fieldCamera(width: number, height: number, seconds: number) {
  const scale = Math.max(width, height) / 64;
  // Very slow bounded travel; avoids reaching a texture edge in long sessions.
  const x = 90 + Math.sin(seconds * 0.0008) * 18;
  const y = -Math.sin(seconds * 0.0008) * 48;
  return { x, y, scale };
}

export function drawFieldGas(
  ctx: CanvasRenderingContext2D,
  gas: HTMLCanvasElement,
  width: number,
  height: number,
  camera: ReturnType<typeof fieldCamera>,
) {
  const mapScale = MAP_SIZE / WORLD;
  ctx.drawImage(
    gas,
    (camera.x - width / camera.scale / 2 + WORLD / 2) * mapScale,
    (camera.y - height / camera.scale / 2 + WORLD / 2) * mapScale,
    width / camera.scale * mapScale,
    height / camera.scale * mapScale,
    0, 0, width, height,
  );
}
