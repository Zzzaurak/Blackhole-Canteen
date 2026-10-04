import { test, expect } from "@playwright/test";
test("recommend, record a different meal, refresh, edit and delete", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("准备几点吃", { exact: true }).fill("22:30");
  await page.getByRole("button", { name: "吃什么？", exact: true }).click();
  await expect(page.locator(".result-card")).toContainText("桃李园");
  await page.getByRole("button", { name: "就去这里" }).click();
  await page.getByRole("button", { name: "饭后记录", exact: true }).click();
  await page.getByLabel("实际食堂").selectOption("qingfen");
  await page.getByLabel("用餐时间", { exact: true }).fill("2026-10-03T18:00");
  await page.getByRole("button", { name: "5 分", exact: true }).click();
  await page
    .getByRole("textbox", { name: "留一句话" })
    .fill("最后去了清芬，热乎乎的一餐。");
  await page.getByRole("button", { name: "保存这次吞星" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await expect(page.locator(".meal-card")).toContainText("最后去了清芬");
  await expect(page.locator(".meal-origin")).toContainText("宇宙推荐 桃李园");
  await expect(page.locator(".meal-origin")).toContainText("实际选择 清芬园");
  await page.getByRole("button", { name: "修改清芬园用餐记录" }).click();
  await page.getByRole("button", { name: "3 分", exact: true }).click();
  await page.getByRole("button", { name: "保存这次吞星" }).click();
  await expect(page.locator(".meal-rating")).toContainText("3 / 5");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除清芬园用餐记录" }).click();
  await expect(page.locator(".meal-card")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("empty candidate state, atlas, mobile layout and paused animations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "播放星系动画" }),
  ).toBeVisible();
  await page.getByLabel("准备几点吃", { exact: true }).fill("15:00");
  await expect(
    page.getByRole("button", { name: "吃什么？", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".launch-area")).toContainText("这个时间没有候选");
  await page.getByRole("button", { name: "食堂星体图鉴" }).click();
  await expect(page.locator(".atlas-card")).toHaveCount(9);
  await page
    .locator(".atlas-card")
    .filter({ has: page.getByRole("heading", { name: "清芬园" }) })
    .click();
  await expect(page.getByRole("dialog")).toContainText("清青快餐");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("storage failure must not claim a successful meal save", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota exceeded");
    };
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await page.getByRole("button", { name: "记一餐", exact: true }).click();
  await page.getByRole("button", { name: "保存这次吞星" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(page.getByRole("alert")).toContainText("保存失败");
  await expect(page.locator(".meal-card")).toHaveCount(0);
});

test("backup download, invalid import and confirmed restore", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "数据与设置" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^stellar-bites-/);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.getByRole("dialog")).toContainText(
    "备份格式或版本不受支持",
  );
  const backup = {
    version: 1,
    recommendations: [],
    locationId: "zijing-dorm",
    preferences: [],
    meals: [
      {
        id: "m-import",
        eatenAt: "2026-10-03T12:00",
        canteenId: "heyuan",
        rating: 5,
        note: "从备份恢复的荷园午餐",
      },
    ],
  };
  await page.locator("input[type=file]").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator(".import-confirm")).toContainText("导入 1 条用餐");
  expect(
    await page.evaluate(() => localStorage.getItem("stellar-bites:v1")),
  ).toBeNull();
  await page.getByRole("button", { name: "确认替换" }).click();
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await expect(page.locator(".meal-card")).toContainText(
    "从备份恢复的荷园午餐",
  );
});

test("a rapid second click does not create another draw; history survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("准备几点吃", { exact: true }).fill("12:00");
  await page
    .getByRole("button", { name: "吃什么？", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("stellar-bites:v1")!).recommendations
          .length,
    ),
  ).toBe(1);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /吞星日志/ })
    .click();
  await page.locator(".recommendation-history summary").click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-status")).toHaveText("尚未记录用餐");
});

test("local flight pauses without jumping and time changes the arm environment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByLabel("准备几点吃", { exact: true }).fill("12:00");
  await expect(page.locator(".space-card")).toHaveAttribute(
    "data-region",
    "arm",
  );
  const star = page.getByRole("button", {
    name: "查看紫荆园，G 型主序星",
    exact: true,
  });
  const initial = await star.evaluate((el) => parseFloat(el.style.top));
  await expect
    .poll(() => star.evaluate((el) => parseFloat(el.style.top)))
    .toBeGreaterThan(initial + 0.6);
  await page.getByRole("button", { name: "暂停星系动画" }).click();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const paused = await star.evaluate((el) => parseFloat(el.style.top));
  await page.waitForTimeout(300);
  expect(await star.evaluate((el) => parseFloat(el.style.top))).toBe(paused);
  const arm = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByLabel("准备几点吃", { exact: true }).fill("15:00");
  await expect(page.locator(".region-badge")).toHaveText("旋臂之间");
  await expect(page.locator(".space-card")).toHaveAttribute(
    "data-region",
    "interarm",
  );
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    )
    .not.toBe(arm);
  await page.getByRole("button", { name: "播放星系动画" }).click();
  await expect
    .poll(() => star.evaluate((el) => parseFloat(el.style.top)))
    .toBeGreaterThan(paused + 0.6);
  await star.focus();
  await expect(star.locator(".star-label")).toHaveCSS("opacity", "1");
});

test("live clock crosses into lunch, manual preview remains fixed", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-05T02:59:50Z") });
  await page.goto("/");
  await expect(page.getByLabel("准备几点吃", { exact: true })).toHaveValue(
    "10:59",
  );
  await expect(page.locator(".space-card")).toHaveAttribute(
    "data-region",
    "interarm",
  );
  await page.clock.fastForward(15000);
  await expect(page.getByLabel("准备几点吃", { exact: true })).toHaveValue(
    "11:00",
  );
  await expect(page.locator(".space-card")).toHaveAttribute(
    "data-region",
    "arm",
  );
  await page.getByLabel("准备几点吃", { exact: true }).fill("15:00");
  await page.clock.fastForward(60000);
  await expect(page.getByLabel("准备几点吃", { exact: true })).toHaveValue(
    "15:00",
  );
  await page.getByRole("button", { name: "现在", exact: true }).click();
  await expect(page.getByLabel("准备几点吃", { exact: true })).toHaveValue(
    "11:01",
  );
});

test("every recommendation can be deleted, linked meals survive, and all records can be cleared", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("准备几点吃", { exact: true }).fill("22:30");
  await page.getByRole("button", { name: "吃什么？", exact: true }).click();
  await expect(page.locator(".result-card")).toBeVisible();
  await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem("stellar-bites:v1")!);
    const rec = store.recommendations[0];
    store.recommendations = Array.from({ length: 26 }, (_, i) => ({ ...rec, id: `history-${i}` }));
    store.meals = [{ id: "actual-meal", canteenId: "qingfen", recommendationId: "history-0", rating: 4, note: "保留这顿饭", eatenAt: "2026-10-05T12:00" }];
    localStorage.setItem("stellar-bites:v1", JSON.stringify(store));
  });
  await page.reload();
  await page.getByRole("navigation").getByRole("button", { name: /吞星日志/ }).click();
  await page.locator(".recommendation-history summary").click();
  await expect(page.locator(".history-row")).toHaveCount(26);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("unavailable"); }; });
  page.once("dialog", d => d.accept());
  await page.locator(".history-row").last().getByRole("button", { name: /删除.*推荐记录/ }).click();
  await expect(page.locator(".history-row")).toHaveCount(26);
  await expect(page.getByRole("alert")).toContainText("保存失败");
  await page.reload();
  await page.getByRole("navigation").getByRole("button", { name: /吞星日志/ }).click();
  await page.locator(".recommendation-history summary").click();
  page.once("dialog", d => d.accept());
  await page.locator(".history-row").last().getByRole("button", { name: /删除.*推荐记录/ }).click();
  await expect(page.locator(".history-row")).toHaveCount(25);
  await expect(page.locator(".meal-card")).toContainText("保留这顿饭");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("stellar-bites:v1")!).meals[0].recommendationId)).toBeUndefined();
  await page.reload();
  await page.getByRole("button", { name: "关于这片宇宙", exact: true }).click();
  page.once("dialog", d => d.dismiss());
  await page.getByRole("button", { name: "清空所有记录" }).click();
  await expect(page.getByRole("dialog")).toContainText("1 条用餐、25");
  page.once("dialog", d => d.accept());
  await page.getByRole("button", { name: "清空所有记录" }).click();
  await expect(page.getByRole("dialog")).toContainText("0 条用餐、0");
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("stellar-bites:v1")!));
  expect(saved.meals).toEqual([]);
  expect(saved.recommendations).toEqual([]);
  expect(saved.locationId).toBe("zijing-dorm");
});
