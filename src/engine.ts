import { canteens, places } from "./data";
import type { Canteen, Conditions, Meal, Probability } from "./types";
export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const isOpen = (canteen: Canteen, time: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time) &&
  canteen.hours.some(
    ([start, end]) =>
      minutes(time) >= minutes(start) && minutes(time) < minutes(end),
  );
export function recommend(
  conditions: Conditions,
  meals: Meal[],
): Probability[] {
  const eligible = canteens.filter((c) => isOpen(c, conditions.time));
  if (!eligible.length) return [];
  const location = places.find((p) => p.id === conditions.locationId);
  const distances = eligible.map((c) => {
    const p = places.find((p) => p.id === c.id)!;
    return location ? Math.hypot(p.x - location.x, p.y - location.y) : 0;
  });
  const max = Math.max(...distances, 1);
  const recent = [...meals]
    .sort((a, b) => b.eatenAt.localeCompare(a.eatenAt))
    .slice(0, 3);
  const scored = eligible.map((c, i) => {
    const history = meals.filter((m) => m.canteenId === c.id);
    // Two prior observations retain the user's stated taste preference while new ratings adapt it.
    const rating =
      (c.taste * 2 + history.reduce((s, m) => s + m.rating, 0)) /
      (2 + history.length) /
      5;
    const novelty = 1 - recent.filter((m) => m.canteenId === c.id).length / 3;
    const match = conditions.preferences.length
      ? conditions.preferences.filter((p) => c.tags.includes(p)).length /
        conditions.preferences.length
      : 0.5;
    const distance = 1 - distances[i] / max;
    const weights = [
      location ? 0.35 : 0,
      conditions.preferences.length ? 0.25 : 0,
      0.25,
      0.15,
    ];
    if (conditions.mood === "tired") weights[0] *= 2;
    if (conditions.mood === "explore") weights[3] *= 2;
    if (conditions.mood === "comfort") weights[2] *= 2;
    const sum = weights.reduce((s, v) => s + v, 0);
    const score =
      [distance, match, rating, novelty].reduce(
        (s, v, j) => s + v * weights[j],
        0,
      ) / sum;
    const reasons = [
      location && distance >= 0.65 ? "离出发地较近" : "",
      match > 0.5 && conditions.preferences.length ? "符合今天的偏好" : "",
      history.length && rating >= 0.75
        ? "你之前评价不错"
        : c.taste >= 4
          ? "符合你的口味印象"
          : "",
      novelty === 1 ? "最近三餐没吃过" : "",
      c.id === "taoli" && minutes(conditions.time) >= 19 * 60
        ? "夜宵陪你到 23:00"
        : "",
    ].filter(Boolean);
    return {
      canteenId: c.id,
      score,
      reasons: reasons.length ? reasons : ["给日常一点随机的惊喜"],
    };
  });
  const total = scored.reduce((sum, item) => sum + item.score, 0);
  return scored.map((item) => ({
    ...item,
    probability:
      total > 0
        ? (0.8 * item.score) / total + 0.2 / scored.length
        : 1 / scored.length,
  }));
}
export function draw(
  distribution: Probability[],
  random: () => number = Math.random,
): string | null {
  if (!distribution.length) return null;
  const target = Math.min(1 - Number.EPSILON, Math.max(0, random()));
  let cumulative = 0;
  return (
    distribution.find((item) => {
      cumulative += item.probability;
      return target < cumulative;
    })?.canteenId ?? distribution.at(-1)!.canteenId
  );
}
export function localDateTime(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
