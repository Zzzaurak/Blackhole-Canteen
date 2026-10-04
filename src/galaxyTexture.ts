/** A seamless, cached patch of an arm, seen from inside the galactic disc.
 * Fine stars are baked into the texture; only nearby stars animate individually.
 * No photograph, generated image, or per-frame pixel noise is needed.
 */
let cached: HTMLCanvasElement | undefined;
const TAU = Math.PI * 2;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const hash = (x: number, y: number) => {
  let n = Math.imul(x + 713, 374761393) ^ Math.imul(y + 947, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
// Periodic value noise keeps both edges identical when the field drifts and wraps.
function noise(u: number, v: number, frequency: number) {
  const x = ((u * frequency) % frequency + frequency) % frequency;
  const y = ((v * frequency) % frequency + frequency) % frequency;
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash(ix, iy), b = hash((ix + 1) % frequency, iy);
  const c = hash(ix, (iy + 1) % frequency);
  const d = hash((ix + 1) % frequency, (iy + 1) % frequency);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

export function getArmTexture() {
  if (cached) return cached;
  const resolution = 768;
  const base = document.createElement("canvas");
  base.width = base.height = resolution;
  const context = base.getContext("2d")!;
  const image = context.createImageData(resolution, resolution);
  const density = new Float32Array(resolution * resolution);
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = x / resolution, v = y / resolution;
      // Curved, branching structures at several scales, never a uniform stripe.
      const warp = noise(u + 0.17, v + 0.31, 4) - 0.5;
      const turbulence = (noise(u, v, 23) - 0.5) * 0.022;
      const a = u + 0.12 * Math.sin(v * TAU) + warp * 0.13 + turbulence;
      const b = v + u + 0.1 * Math.sin(u * TAU) + warp * 0.1 - turbulence;
      const large = noise(a, b, 3);
      const medium = noise(a + 0.3, b, 9);
      const fine = noise(a, b, 27);
      const grain = noise(a, b, 81);
      const gas = clamp((large * 0.34 + medium * 0.3 + fine * 0.24 + grain * 0.12 - 0.16) / 0.65);
      const knots = Math.pow(clamp((medium + fine * 0.3 - 0.49) / 0.56), 2);
      const filament = noise(a + warp * 0.12, b, 7) * 0.55
        + noise(a, b, 17) * 0.28 + fine * 0.12 + grain * 0.05;
      const dust = Math.exp(-Math.abs(filament - 0.5) * 27) * (0.35 + medium * 0.65)
        + Math.exp(-Math.abs(noise(a, b, 19) * 0.7 + grain * 0.3 - 0.51) * 55) * 0.26;
      const transmission = 1 - clamp(dust) * 0.63;
      const speckle = 0.84 + hash(x, y) * 0.32;
      const warmth = large * (1 - knots) * 13;
      const index = y * resolution + x;
      density[index] = clamp((gas * 0.65 + knots * 0.85) * transmission);
      image.data[index * 4] = (9 + gas * 51 + knots * 47 + warmth) * transmission * speckle;
      image.data[index * 4 + 1] = (13 + gas * 53 + knots * 75 + warmth * 0.55) * transmission * speckle;
      image.data[index * 4 + 2] = (21 + gas * 58 + knots * 103) * transmission * speckle;
      image.data[index * 4 + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = document.createElement("canvas");
  texture.width = texture.height = resolution * 2;
  const ctx = texture.getContext("2d")!;
  ctx.drawImage(base, 0, 0, texture.width, texture.height);
  let seed = 21553;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  // Tens of thousands of unresolved suns: denser in gas knots, fewer behind dust.
  for (let i = 0; i < 105000; i++) {
    const u = random(), v = random();
    const gas = density[Math.floor(v * resolution) * resolution + Math.floor(u * resolution)];
    if (random() > 0.17 + gas * 0.95) continue;
    const x = u * texture.width, y = v * texture.height;
    const size = 0.3 + Math.pow(random(), 3) * 1.05;
    const warm = random() < 0.22;
    ctx.fillStyle = warm ? "#efcfaa" : "#bcdcf7";
    ctx.globalAlpha = (0.12 + random() * 0.5) * (0.4 + gas);
    ctx.fillRect(x, y, size, size);
  }
  // Sparse young clusters, with imperfect halos and resolved stars around them.
  for (let i = 0; i < 120; i++) {
    const u = random(), v = random();
    const gas = density[Math.floor(v * resolution) * resolution + Math.floor(u * resolution)];
    if (gas < 0.28) continue;
    const x = u * texture.width, y = v * texture.height;
    const radius = 8 + random() * 30;
    // Wrap halos too, so clusters crossing an edge never create a seam.
    for (const dx of [-texture.width, 0, texture.width]) {
      for (const dy of [-texture.height, 0, texture.height]) {
        const glow = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, radius);
        glow.addColorStop(0, "#b6e4ff80");
        glow.addColorStop(0.18, "#92c9ed40");
        glow.addColorStop(0.5, "#609fc617");
        glow.addColorStop(1, "#609fc600");
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = glow;
        ctx.fillRect(x + dx - radius, y + dy - radius, radius * 2, radius * 2);
      }
    }
    for (let j = 0; j < 85; j++) {
      const angle = random() * TAU;
      const r = Math.pow(random(), 1.8) * radius;
      const sx = (x + Math.cos(angle) * r + texture.width) % texture.width;
      const sy = (y + Math.sin(angle) * r * 0.65 + texture.height) % texture.height;
      ctx.globalAlpha = 0.18 + random() * 0.55;
      ctx.fillStyle = "#d4eeff";
      const size = 0.35 + random() * 0.8;
      ctx.fillRect(sx, sy, size, size);
    }
  }
  cached = texture;
  return texture;
}
