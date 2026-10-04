export type Mood = "normal" | "tired" | "explore" | "comfort";
export type Preference =
  "便宜一点" | "口味重些" | "好吃优先" | "选择丰富" | "分量要足";
export interface Place {
  id: string;
  name: string;
  group: "教学区" | "生活区" | "图书馆与院系" | "食堂";
  x: number;
  y: number;
  note: string;
}
export interface Canteen {
  id: string;
  name: string;
  star: string;
  code: string;
  color: string;
  size: number;
  position: [number, number];
  kind:
    | "sun"
    | "red"
    | "variable"
    | "dwarf"
    | "orange"
    | "blue"
    | "multiple"
    | "giant"
    | "white";
  description: string;
  metaphor: string;
  price: number | null;
  taste: number;
  tags: Preference[];
  area: string;
  hours: [string, string][];
  companions: { name: string; note: string; color: string }[];
}
export interface Conditions {
  time: string;
  locationId: string;
  mood: Mood;
  preferences: Preference[];
}
export interface Probability {
  canteenId: string;
  probability: number;
  score: number;
  reasons: string[];
}
export interface Recommendation {
  id: string;
  createdAt: string;
  conditions: Conditions;
  distribution: Probability[];
  canteenId: string;
  accepted: boolean;
}
export interface Meal {
  id: string;
  eatenAt: string;
  canteenId: string;
  rating: number;
  note: string;
  recommendationId?: string;
}
export interface Store {
  version: 1;
  recommendations: Recommendation[];
  meals: Meal[];
  locationId: string;
  preferences: Preference[];
}
