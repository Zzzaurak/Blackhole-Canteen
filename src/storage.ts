import { canteens, places, preferences } from "./data";
import type { Store } from "./types";
export const STORAGE_KEY = "stellar-bites:v1";
export const emptyStore = (): Store => ({
  version: 1,
  recommendations: [],
  meals: [],
  locationId: "zijing-dorm",
  preferences: [],
});
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const validId = (value: unknown) =>
  typeof value === "string" && canteens.some((c) => c.id === value);
const text = (value: unknown, max = 200) =>
  typeof value === "string" && value.length <= max;
const timestamp = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const validPreferences = (value: unknown) =>
  Array.isArray(value) &&
  value.length <= preferences.length &&
  value.every((p) => preferences.includes(p));
function validConditions(value: unknown): boolean {
  if (!object(value)) return false;
  return (
    /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.time)) &&
    places.some((p) => p.id === value.locationId) &&
    ["normal", "tired", "explore", "comfort"].includes(String(value.mood)) &&
    validPreferences(value.preferences)
  );
}
export function parseStore(raw: string): Store {
  if (raw.length > 5_000_000)
    throw new Error("文件过大，请选择本应用导出的备份。");
  const data: unknown = JSON.parse(raw);
  if (
    !object(data) ||
    data.version !== 1 ||
    !Array.isArray(data.meals) ||
    !Array.isArray(data.recommendations) ||
    !places.some((p) => p.id === data.locationId) ||
    !validPreferences(data.preferences)
  )
    throw new Error("备份格式或版本不受支持。");
  const recs = data.recommendations;
  const validRecs = recs.every(
    (r) =>
      object(r) &&
      text(r.id) &&
      timestamp(r.createdAt) &&
      validId(r.canteenId) &&
      typeof r.accepted === "boolean" &&
      validConditions(r.conditions) &&
      Array.isArray(r.distribution) &&
      r.distribution.length > 0 &&
      r.distribution.every(
        (p) =>
          object(p) &&
          validId(p.canteenId) &&
          typeof p.probability === "number" &&
          Number.isFinite(p.probability) &&
          p.probability >= 0 &&
          p.probability <= 1 &&
          typeof p.score === "number" &&
          Number.isFinite(p.score) &&
          Array.isArray(p.reasons) &&
          p.reasons.every((s) => text(s)),
      ) &&
      Math.abs(
        r.distribution.reduce(
          (s: number, p: { probability: number }) => s + p.probability,
          0,
        ) - 1,
      ) < 1e-6 &&
      r.distribution.some(
        (p: { canteenId: string }) => p.canteenId === r.canteenId,
      ) &&
      new Set(r.distribution.map((p: { canteenId: string }) => p.canteenId))
        .size === r.distribution.length,
  );
  const validMeals = data.meals.every(
    (m) =>
      object(m) &&
      text(m.id) &&
      timestamp(m.eatenAt) &&
      validId(m.canteenId) &&
      Number.isInteger(m.rating) &&
      Number(m.rating) >= 1 &&
      Number(m.rating) <= 5 &&
      text(m.note, 1000) &&
      (m.recommendationId === undefined ||
        (text(m.recommendationId) &&
          recs.some((r) => r.id === m.recommendationId))),
  );
  if (
    !validRecs ||
    !validMeals ||
    new Set(data.meals.map((m) => m.id)).size !== data.meals.length ||
    new Set(recs.map((r) => r.id)).size !== recs.length
  )
    throw new Error("备份中有无效记录，原有数据未被更改。");
  const linked = data.meals.flatMap((m) =>
    m.recommendationId ? [m.recommendationId] : [],
  );
  if (new Set(linked).size !== linked.length)
    throw new Error("同一次推荐不能关联多次用餐。");
  return data as unknown as Store;
}
export function loadStore(): { data: Store; error?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? parseStore(raw) : emptyStore() };
  } catch {
    return {
      data: emptyStore(),
      error: "本地记录无法读取。暂未覆盖原数据，请先导出原始数据备份。",
    };
  }
}
