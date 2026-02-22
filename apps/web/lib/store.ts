/**
 * Eden Pods — Local Store (no backend required)
 * All data is kept in localStorage and accessed via a simple reactive store.
 */

import { v4 as uuid } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface PodType {
  id: string;
  name: string;
  icon: string;
  description: string;
  plants: string[];
  growthModelId: string;
  nutritionTags: string[];
  difficulty: "easy" | "moderate";
  color: string;
}

export interface GrowthStage {
  id: string;
  name: string;
  icon: string;
  dayStart: number;
  dayEnd: number;
  description: string;
  whatToExpect: string;
  color: string;
}

export interface GrowthModel {
  id: string;
  name: string;
  stages: GrowthStage[];
}

export interface Throw {
  id: string;
  userId: string;
  podTypeId: string;
  growthModelId: string;
  throwDate: string; // ISO
  createdAt: string;
  notes: string;
  locationLabel: string; // user-typed label, e.g. "Back garden"
}

export interface Observation {
  id: string;
  throwId: string;
  stageId: string;
  observedAt: string;
  notes: string;
}

export interface Harvest {
  id: string;
  throwId: string;
  plantId: string;
  quantityClass: "small" | "medium" | "large";
  harvestedAt: string;
  notes: string;
}

export interface Notification {
  id: string;
  throwId: string;
  stageId: string;
  stageName: string;
  stageIcon: string;
  title: string;
  body: string;
  scheduledFor: string;
  read: boolean;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  plants: string[];
  instructions: string;
  nutritionTags: string[];
  time: string;
  difficulty: string;
}

export interface AppState {
  user: User | null;
  throws: Throw[];
  observations: Observation[];
  harvests: Harvest[];
  notifications: Notification[];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const POD_TYPES: PodType[] = [
  {
    id: "pod-meadow-mix",
    name: "Meadow Mix",
    icon: "🌼",
    description: "Hardy wildflowers and ground cover for open spaces",
    plants: ["yarrow", "clover-red", "calendula", "dandelion"],
    growthModelId: "temperate-herb",
    nutritionTags: ["vitamin-c", "antioxidants", "minerals"],
    difficulty: "easy",
    color: "#7BC67E",
  },
  {
    id: "pod-forest-edge",
    name: "Forest Edge",
    icon: "🌿",
    description: "Shrubs and ground cover for forest margins",
    plants: ["elderberry", "blackcurrant", "nettle", "wood-sorrel"],
    growthModelId: "temperate-shrub",
    nutritionTags: ["vitamin-c", "iron", "antioxidants"],
    difficulty: "easy",
    color: "#4A7C59",
  },
  {
    id: "pod-herb-spiral",
    name: "Herb Spiral",
    icon: "🌱",
    description: "Culinary and medicinal herbs for daily kitchen use",
    plants: ["mint", "lemon-balm", "yarrow", "calendula"],
    growthModelId: "temperate-herb",
    nutritionTags: ["antimicrobial", "digestive", "minerals"],
    difficulty: "easy",
    color: "#A8D5A2",
  },
  {
    id: "pod-tropical-canopy",
    name: "Tropical Canopy",
    icon: "🌴",
    description: "Fast-growing tropical plants for warm climates",
    plants: ["moringa", "sweet-potato", "amaranth"],
    growthModelId: "tropical-fast",
    nutritionTags: ["protein", "iron", "vitamin-a"],
    difficulty: "easy",
    color: "#F4A460",
  },
  {
    id: "pod-grain-guild",
    name: "Grain Guild",
    icon: "🌾",
    description: "Calorie-dense cereals and legumes",
    plants: ["amaranth", "sunflower"],
    growthModelId: "temperate-annual",
    nutritionTags: ["carbohydrates", "protein", "iron"],
    difficulty: "moderate",
    color: "#DEB887",
  },
  {
    id: "pod-vine-canopy",
    name: "Vine Canopy",
    icon: "🍇",
    description: "Climbing plants for vertical growing",
    plants: ["nasturtium"],
    growthModelId: "temperate-vine",
    nutritionTags: ["vitamin-c", "protein"],
    difficulty: "easy",
    color: "#9B59B6",
  },
];

export const GROWTH_MODELS: GrowthModel[] = [
  {
    id: "temperate-herb",
    name: "Temperate Herb",
    stages: [
      { id: "germination", name: "Germination", icon: "💧", dayStart: 0,   dayEnd: 14,  color: "#8B7355", description: "Seeds absorbing water underground",          whatToExpect: "No visible changes yet. Keep the area slightly moist." },
      { id: "sprout",      name: "Sprouting",   icon: "🌱", dayStart: 14,  dayEnd: 30,  color: "#90EE90", description: "First shoots emerge above soil",             whatToExpect: "Look for tiny pale green shoots. Very delicate stage." },
      { id: "leafing",     name: "Leafing",     icon: "🍃", dayStart: 30,  dayEnd: 60,  color: "#2ECC71", description: "True leaves forming",                        whatToExpect: "Plants are recognizable now. Thin if overcrowded." },
      { id: "flowering",   name: "Flowering",   icon: "🌸", dayStart: 60,  dayEnd: 90,  color: "#FF69B4", description: "Flowers appearing",                          whatToExpect: "Harvest flowers for tea or food. Leave 30% for pollinators." },
      { id: "fruiting",    name: "Seeding",     icon: "🌻", dayStart: 90,  dayEnd: 120, color: "#F39C12", description: "Seeds developing",                           whatToExpect: "Harvest seeds when dry and brown." },
      { id: "spread",      name: "Spreading",   icon: "🌬️", dayStart: 120, dayEnd: 365, color: "#3498DB", description: "Self-spreading via seed dispersal",           whatToExpect: "Expect new plants nearby next season." },
    ],
  },
  {
    id: "temperate-shrub",
    name: "Temperate Shrub",
    stages: [
      { id: "germination", name: "Germination",     icon: "💧", dayStart: 0,   dayEnd: 21,  color: "#8B7355", description: "Seeds stratifying",           whatToExpect: "Shrub seeds take longer. Be patient." },
      { id: "sprout",      name: "Sprouting",       icon: "🌱", dayStart: 21,  dayEnd: 45,  color: "#90EE90", description: "First shoots emerging",       whatToExpect: "Tiny woody stems appearing." },
      { id: "leafing",     name: "Establishing",    icon: "🍃", dayStart: 45,  dayEnd: 120, color: "#2ECC71", description: "Building root system",        whatToExpect: "Slow above-ground growth. Roots are the priority." },
      { id: "flowering",   name: "First Flowering", icon: "🌸", dayStart: 365, dayEnd: 540, color: "#FF69B4", description: "First flowers year 2+",       whatToExpect: "Year 2: first flowers. Harvest sparingly." },
      { id: "fruiting",    name: "Fruiting",        icon: "🫐", dayStart: 540, dayEnd: 730, color: "#F39C12", description: "First berries year 2–3",      whatToExpect: "Small first harvest. Doubles each year." },
      { id: "spread",      name: "Established",     icon: "🌳", dayStart: 730, dayEnd: 3650,color: "#3498DB", description: "Mature, self-seeding shrub",  whatToExpect: "Colony forming. Divide or thin as needed." },
    ],
  },
  {
    id: "tropical-fast",
    name: "Tropical Fast-Growing",
    stages: [
      { id: "germination", name: "Germination",    icon: "💧", dayStart: 0,   dayEnd: 7,   color: "#8B7355", description: "Very fast germination",       whatToExpect: "Watch within the week." },
      { id: "sprout",      name: "Sprouting",      icon: "🌱", dayStart: 7,   dayEnd: 21,  color: "#90EE90", description: "Rapid early growth",          whatToExpect: "Fast-growing shoots. Manage spacing." },
      { id: "leafing",     name: "Canopy Building",icon: "🌴", dayStart: 21,  dayEnd: 60,  color: "#2ECC71", description: "Rapid canopy development",    whatToExpect: "Harvest young leaves for nutrition." },
      { id: "flowering",   name: "Flowering",      icon: "🌺", dayStart: 60,  dayEnd: 90,  color: "#FF69B4", description: "Flowers and pods forming",    whatToExpect: "Pods edible when young." },
      { id: "fruiting",    name: "Pod Production", icon: "🌿", dayStart: 90,  dayEnd: 180, color: "#F39C12", description: "Continuous pod production",   whatToExpect: "Harvest continuously for best yield." },
      { id: "spread",      name: "Established",    icon: "🌳", dayStart: 180, dayEnd: 1825,color: "#3498DB", description: "Established food forest layer",whatToExpect: "Coppice to maintain productivity." },
    ],
  },
  {
    id: "temperate-annual",
    name: "Temperate Annual",
    stages: [
      { id: "germination", name: "Germination", icon: "💧", dayStart: 0,   dayEnd: 10,  color: "#8B7355", description: "Fast germination",          whatToExpect: "Activity within 10 days." },
      { id: "sprout",      name: "Sprouting",   icon: "🌱", dayStart: 10,  dayEnd: 25,  color: "#90EE90", description: "Seedlings establishing",    whatToExpect: "Thin to 30cm spacing if dense." },
      { id: "leafing",     name: "Leafing",     icon: "🍃", dayStart: 25,  dayEnd: 50,  color: "#2ECC71", description: "Rapid leaf growth",         whatToExpect: "Harvest outer leaves. Peak nutrition." },
      { id: "flowering",   name: "Flowering",   icon: "🌸", dayStart: 50,  dayEnd: 80,  color: "#FF69B4", description: "Going to seed",             whatToExpect: "Harvest now or let go to seed." },
      { id: "fruiting",    name: "Seed Set",    icon: "🌾", dayStart: 80,  dayEnd: 110, color: "#F39C12", description: "Seeds maturing",            whatToExpect: "Collect dry seeds for replanting." },
      { id: "spread",      name: "Self-Sown",   icon: "🌬️", dayStart: 110, dayEnd: 365, color: "#3498DB", description: "Seeds shed naturally",      whatToExpect: "New plants will appear next spring." },
    ],
  },
  {
    id: "temperate-vine",
    name: "Temperate Vine",
    stages: [
      { id: "germination", name: "Germination", icon: "💧", dayStart: 0,  dayEnd: 14,  color: "#8B7355", description: "Vine seeds germinating",    whatToExpect: "Keep moist. Takes up to 2 weeks." },
      { id: "sprout",      name: "Sprouting",   icon: "🌱", dayStart: 14, dayEnd: 28,  color: "#90EE90", description: "First tendrils emerging",   whatToExpect: "Provide a surface to climb." },
      { id: "leafing",     name: "Climbing",    icon: "🍃", dayStart: 28, dayEnd: 60,  color: "#2ECC71", description: "Rapid vertical growth",     whatToExpect: "Harvest young leaves and flowers." },
      { id: "flowering",   name: "Flowering",   icon: "🌺", dayStart: 60, dayEnd: 90,  color: "#FF69B4", description: "Prolific flowering",        whatToExpect: "Edible flowers! Leave some for pollinators." },
      { id: "fruiting",    name: "Fruiting",    icon: "🍇", dayStart: 90, dayEnd: 150, color: "#F39C12", description: "Fruit and pods forming",    whatToExpect: "Harvest pods young and tender." },
      { id: "spread",      name: "Self-Seeding",icon: "🌬️", dayStart: 150,dayEnd: 365, color: "#3498DB", description: "Seeds spreading",           whatToExpect: "Will self-seed prolifically." },
    ],
  },
];

export const RECIPES: Recipe[] = [
  { id: "r1", name: "Spring Dandelion Salad",    icon: "🥗", plants: ["dandelion","clover-red","nasturtium"], instructions: "Gather young leaves, rinse well. Toss with olive oil and lemon. Add flowers for color.",                       nutritionTags: ["vitamin-c","iron","calcium"],              time: "5 min",    difficulty: "easy" },
  { id: "r2", name: "Nettle Iron Tea",            icon: "🫖", plants: ["nettle","mint","lemon-balm"],          instructions: "Use tongs to pick young nettle tops. Steep with mint and lemon balm for 10 min.",                           nutritionTags: ["iron","minerals","anti-inflammatory"],     time: "15 min",   difficulty: "easy" },
  { id: "r3", name: "Elderflower Cordial",        icon: "🌸", plants: ["elderberry"],                          instructions: "Collect 20 flower heads, steep in 1L hot water with sugar and lemon for 24h. Strain and bottle.",           nutritionTags: ["vitamin-c","antioxidants"],                time: "overnight",difficulty: "moderate" },
  { id: "r4", name: "Moringa Superfood Powder",   icon: "💚", plants: ["moringa"],                              instructions: "Dry leaves in shade 3–5 days. Grind to powder. Add 1 tsp to smoothies or soups daily.",                     nutritionTags: ["protein","iron","calcium","vitamin-a"],    time: "5 days",   difficulty: "easy" },
  { id: "r5", name: "Calendula Healing Salve",    icon: "🌻", plants: ["calendula"],                           instructions: "Infuse dried petals in olive oil for 2 weeks. Strain, mix with melted beeswax. Apply to skin.",             nutritionTags: ["anti-inflammatory","wound-healing"],       time: "2 weeks",  difficulty: "moderate" },
  { id: "r6", name: "Amaranth Power Porridge",    icon: "🥣", plants: ["amaranth"],                            instructions: "Toast seeds lightly. Simmer 1 cup in 2.5 cups water for 20 min. Add banana or honey to taste.",            nutritionTags: ["protein","calcium","iron"],                time: "25 min",   difficulty: "easy" },
  { id: "r7", name: "Nasturtium Capers",          icon: "🫙", plants: ["nasturtium"],                          instructions: "Pickle green nasturtium seeds in vinegar, salt, and sugar for 2+ weeks. Use like capers in cooking.",        nutritionTags: ["vitamin-c","antimicrobial"],               time: "2 weeks",  difficulty: "easy" },
  { id: "r8", name: "Forest Floor Soup",          icon: "🍲", plants: ["nettle","dandelion","wood-sorrel"],    instructions: "Sauté onion, add young nettle and dandelion leaves, cover with stock. Simmer 15 min. Finish with sorrel.",   nutritionTags: ["iron","vitamin-c","calcium"],              time: "20 min",   difficulty: "easy" },
  { id: "r9", name: "Wild Sunflower Butter",      icon: "🌻", plants: ["sunflower"],                           instructions: "Roast hulled seeds 10 min at 180°C. Blend with a pinch of salt and oil until smooth.",                      nutritionTags: ["vitamin-e","protein","healthy-fats"],      time: "20 min",   difficulty: "easy" },
  { id: "r10",name: "Yarrow First Aid Wash",      icon: "🩹", plants: ["yarrow"],                              instructions: "Steep fresh yarrow flowers in boiling water for 10 min. Cool completely. Use to wash minor cuts.",           nutritionTags: ["antimicrobial","anti-inflammatory"],       time: "15 min",   difficulty: "easy" },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "eden-pods-state";

const DEFAULT_STATE: AppState = {
  user: null,
  throws: [],
  observations: [],
  harvests: [],
  notifications: [],
};

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("localStorage write failed");
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── State mutations ──────────────────────────────────────────────────────────

export function signIn(name: string): User {
  const state = loadState();
  const user: User = state.user ?? {
    id: uuid(),
    name,
    createdAt: new Date().toISOString(),
  };
  user.name = name;
  saveState({ ...state, user });
  return user;
}

export function signOut(): void {
  const state = loadState();
  saveState({ ...state, user: null });
}

export function addThrow(data: Omit<Throw, "id" | "createdAt">): Throw {
  const state = loadState();
  const t: Throw = { ...data, id: uuid(), createdAt: new Date().toISOString() };
  const updated = { ...state, throws: [t, ...state.throws] };

  // Auto-generate notifications for all future stages
  const model = GROWTH_MODELS.find((m) => m.id === data.growthModelId);
  if (model) {
    const throwDate = new Date(data.throwDate);
    const now = new Date();
    const newNotifs: Notification[] = [];

    for (const stage of model.stages) {
      const stageDate = new Date(throwDate);
      stageDate.setDate(stageDate.getDate() + stage.dayStart);
      if (stageDate < now) continue; // skip past stages

      newNotifs.push({
        id: uuid(),
        throwId: t.id,
        stageId: stage.id,
        stageName: stage.name,
        stageIcon: stage.icon,
        title: `${stage.icon} ${stage.name} stage starting`,
        body: stage.whatToExpect,
        scheduledFor: stageDate.toISOString(),
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    updated.notifications = [...newNotifs, ...updated.notifications];
  }

  saveState(updated);
  return t;
}

export function addObservation(data: Omit<Observation, "id" | "observedAt">): Observation {
  const state = loadState();
  const obs: Observation = {
    ...data,
    id: uuid(),
    observedAt: new Date().toISOString(),
  };
  saveState({ ...state, observations: [obs, ...state.observations] });
  return obs;
}

export function addHarvest(data: Omit<Harvest, "id" | "harvestedAt">): Harvest {
  const state = loadState();
  const h: Harvest = {
    ...data,
    id: uuid(),
    harvestedAt: new Date().toISOString(),
  };
  saveState({ ...state, harvests: [h, ...state.harvests] });
  return h;
}

export function markNotificationRead(id: string): void {
  const state = loadState();
  saveState({
    ...state,
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  });
}

export function markAllNotificationsRead(): void {
  const state = loadState();
  saveState({
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  });
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function getCurrentStage(
  throwDate: string,
  model: GrowthModel
): { stage: GrowthStage; daysSince: number; progress: number } {
  const days = Math.floor(
    (Date.now() - new Date(throwDate).getTime()) / 86400000
  );
  let current = model.stages[0];
  for (const s of model.stages) {
    if (days >= s.dayStart) current = s;
  }
  const len = Math.max(current.dayEnd - current.dayStart, 1);
  const progress = Math.min(100, Math.max(0, ((days - current.dayStart) / len) * 100));
  return { stage: current, daysSince: days, progress };
}

export function getNextStage(
  throwDate: string,
  model: GrowthModel
): GrowthStage | null {
  const { stage } = getCurrentStage(throwDate, model);
  const idx = model.stages.findIndex((s) => s.id === stage.id);
  return model.stages[idx + 1] ?? null;
}

export function getDueNotifications(notifications: Notification[]): Notification[] {
  const now = new Date().toISOString();
  return notifications.filter((n) => !n.read && n.scheduledFor <= now);
}

export function getBirthrightProjection(
  podCount: number,
  years = 6
): { year: number; pods: number; area: string }[] {
  return Array.from({ length: years + 1 }, (_, y) => {
    const pods = Math.min(podCount * Math.pow(2, y), 99999);
    const sqm = pods * 4;
    return {
      year: y,
      pods,
      area: sqm >= 10000 ? `${(sqm / 10000).toFixed(1)} ha` : `${sqm.toLocaleString()} m²`,
    };
  });
}

export const QUANTITY_LABELS = { small: "Small handful", medium: "Medium bowlful", large: "Large basketful" };
export const QUANTITY_ICONS  = { small: "🤏",            medium: "🥣",             large: "🧺" };
export const QUANTITY_GRAMS  = { small: 50,              medium: 150,              large: 400 };
