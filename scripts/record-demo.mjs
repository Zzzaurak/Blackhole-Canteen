// Records the actual UI, not a generated video. Run after starting npm run dev.
// One-time recorder dependency: npx playwright install ffmpeg
import { chromium, expect } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

await mkdir("docs/previews", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  reducedMotion: "no-preference",
  timezoneId: "Asia/Shanghai",
  viewport: { width: 1440, height: 1080 },
  recordVideo: {
    dir: "test-results/demo-raw",
    size: { width: 1440, height: 1080 },
  },
});
const page = await context.newPage();
const video = page.video();
try {
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".mascot img").waitFor();
  const started = Date.now();
  const at = async (seconds) => {
    const delay = seconds * 1000 - (Date.now() - started);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  };
  await at(1.5);
  await page.getByLabel("准备几点吃", { exact: true }).fill("22:30");
  await at(3);
  await page.getByRole("button", { name: "不想走远", exact: false }).click();
  await at(4);
  await page.getByRole("button", { name: "口味重些", exact: true }).click();
  await at(5);
  await page
    .getByRole("button", { name: "吃什么？", exact: true })
    .click();
  // Let the real five-second movie and live-scene dissolve finish normally.
  await expect(page.locator(".result-card")).toContainText("桃李园", { timeout: 15000 });
  await at(12);
  await page.getByRole("button", { name: "就去这里" }).click();
  await at(14);
  await page.getByRole("button", { name: "饭后记录", exact: true }).click();
  await at(15);
  await page.getByRole("button", { name: "5 分", exact: true }).click();
  await at(16);
  await page
    .getByRole("textbox", { name: "留一句话" })
    .fill("晚归，也有一口热乎乎的饭。");
  await at(18);
  await page.getByRole("button", { name: "保存这次吞星" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await at(21);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await expect(page.locator(".meal-card")).toContainText("晚归，也有一口热乎乎的饭。");
  await at(24);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await expect(page.locator(".meal-card")).toContainText("晚归，也有一口热乎乎的饭。");
  await at(27.5);
} finally {
  await context.close();
  await browser.close();
}
const raw = await video.path();
// Reject an overlong take instead of cutting off a completed workflow.
const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", raw], { encoding: "utf8" }).trim());
if (!Number.isFinite(duration) || duration > 30) {
  throw new Error(`The recording is ${duration}s; rerun to fit the 30-second homework limit. Raw take: ${raw}`);
}
// Encoding the actual recording makes no model/API calls.
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    raw,
    "-vf",
    "scale=1280:960",
    "-c:v",
    "libx264",
    "-crf",
    "26",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    "docs/previews/demo-current.mp4",
  ],
  { stdio: "pipe" },
);
await rm(raw);
console.log(
  `Saved docs/previews/demo-current.mp4 (${duration.toFixed(2)}s, actual UI screen recording, no video generation).`,
);
