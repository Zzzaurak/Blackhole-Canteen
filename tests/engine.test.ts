import { describe, it, expect } from "vitest";
import { canteens, canteenById, places } from "../src/data";
import { draw, isOpen, recommend } from "../src/engine";
import { emptyStore, parseStore } from "../src/storage";
import type { Conditions, Meal, Store } from "../src/types";
const base: Conditions = {
  time: "12:00",
  locationId: "zijing-dorm",
  mood: "normal",
  preferences: [],
};
const meal = (id: string, canteenId: string, rating = 5): Meal => ({
  id,
  canteenId,
  rating,
  note: "",
  eatenAt: "2026-10-03T12:00",
});
describe("hours and reference data", () => {
  it("includes the 9 requested canteens and 10 starting places", () => {
    expect(canteens).toHaveLength(9);
    expect(places.filter((p) => p.group !== "食堂")).toHaveLength(10);
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
  });
  it.each([
    ["06:29", false],
    ["06:30", true],
    ["08:59", true],
    ["09:00", false],
    ["11:00", true],
    ["12:59", true],
    ["13:00", false],
    ["17:00", true],
    ["19:00", false],
    ["", false],
    ["24:00", false],
  ])("handles the boundary %s", (time, expected) =>
    expect(isOpen(canteenById("zijing"), time)).toBe(expected),
  );
  it("only Taoli is eligible after Yushu closes", () => {
    expect(
      recommend({ ...base, time: "22:59" }, []).map((p) => p.canteenId),
    ).toEqual(["taoli"]);
    expect(recommend({ ...base, time: "23:00" }, [])).toEqual([]);
  });
  it("keeps Yushu open until 22:00, excluding closing time", () => {
    expect(isOpen(canteenById("yushu"), "21:59")).toBe(true);
    expect(isOpen(canteenById("yushu"), "22:00")).toBe(false);
    expect(recommend({ ...base, time: "21:00" }, []).map(p => p.canteenId).sort()).toEqual(["taoli", "yushu"]);
  });
  it("has no fabricated prices for Tingtao and Zhilan", () => {
    expect(canteenById("tingtao").price).toBeNull();
    expect(canteenById("zhilan").price).toBeNull();
  });
});
describe("recommendation", () => {
  it("is normalized and has exploration probability without history", () => {
    const p = recommend(base, []);
    expect(p.reduce((s, x) => s + x.probability, 0)).toBeCloseTo(1, 12);
    expect(
      p.every(
        (x) => Number.isFinite(x.probability) && x.probability >= 0.2 / 9,
      ),
    ).toBe(true);
  });
  it("respects weighted sampling intervals including endpoints", () => {
    const p = recommend(base, []);
    expect(draw(p, () => 0)).toBe(p[0].canteenId);
    expect(draw(p, () => 1)).toBe(p.at(-1)?.canteenId);
    let sum = 0;
    for (const item of p) {
      expect(draw(p, () => sum + item.probability / 2)).toBe(item.canteenId);
      sum += item.probability;
    }
    expect(draw([], () => 0)).toBeNull();
  });
  it("nearby mood favors Zijing over Lanyuan from the dorms", () => {
    const normal = recommend(base, []);
    const tired = recommend({ ...base, mood: "tired" }, []);
    const ratio = (p: ReturnType<typeof recommend>) =>
      p.find((p) => p.canteenId === "zijing")!.probability /
      p.find((p) => p.canteenId === "lanyuan")!.probability;
    expect(ratio(tired)).toBeGreaterThan(ratio(normal));
  });
  it("budget preference increases Zijing probability", () => {
    const normal = recommend(base, []).find(
      (p) => p.canteenId === "zijing",
    )!.probability;
    const budget = recommend({ ...base, preferences: ["便宜一点"] }, []).find(
      (p) => p.canteenId === "zijing",
    )!.probability;
    expect(budget).toBeGreaterThan(normal);
  });
  it("learns from actual meals, not recommendation attempts", () => {
    const low = recommend(base, [meal("a", "zijing", 1)]);
    const high = recommend(base, [meal("a", "zijing", 5)]);
    expect(
      high.find((p) => p.canteenId === "zijing")!.probability,
    ).toBeGreaterThan(low.find((p) => p.canteenId === "zijing")!.probability);
  });
  it("uses campus coordinates independently of decorative star coordinates", () => {
    const before = recommend(base, []);
    const c = canteenById("zijing");
    const position = c.position;
    c.position = [99, 99];
    try {
      expect(recommend(base, [])).toEqual(before);
    } finally {
      c.position = position;
    }
  });
});
describe("backup validation", () => {
  const example = (): Store => ({
    ...emptyStore(),
    recommendations: [
      {
        id: "r1",
        createdAt: "2026-10-04T04:00:00Z",
        conditions: base,
        distribution: recommend(base, []),
        canteenId: "zijing",
        accepted: true,
      },
    ],
    meals: [{ ...meal("m1", "qingfen"), recommendationId: "r1" }],
  });
  it("round-trips a meal different from its recommendation", () => {
    const s = example();
    expect(parseStore(JSON.stringify(s))).toEqual(s);
  });
  it("rejects corrupt JSON, invalid version and unknown canteen", () => {
    expect(() => parseStore("{")).toThrow();
    expect(() =>
      parseStore(JSON.stringify({ ...emptyStore(), version: 2 })),
    ).toThrow();
    expect(() =>
      parseStore(
        JSON.stringify({ ...emptyStore(), meals: [meal("x", "unknown")] }),
      ),
    ).toThrow();
  });
  it("rejects orphan links and duplicate meals for a recommendation", () => {
    expect(() =>
      parseStore(
        JSON.stringify({
          ...emptyStore(),
          meals: [{ ...meal("m", "zijing"), recommendationId: "missing" }],
        }),
      ),
    ).toThrow();
    const s = example();
    s.meals.push({ ...meal("m2", "taoli"), recommendationId: "r1" });
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("rejects invalid ratings and incorrect probability totals", () => {
    const s = example();
    s.meals[0].rating = 6;
    expect(() => parseStore(JSON.stringify(s))).toThrow();
    s.meals[0].rating = 4;
    s.recommendations[0].distribution[0].probability = 1;
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
});
