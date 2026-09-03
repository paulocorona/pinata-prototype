export type StickId =
  | "stick1"
  | "stick2"
  | "stick3"
  | "stick4"
  | "stick5"
  | "stick6"
  | "stick7";

export interface StickDef {
  id: StickId;
  name: string;
  /** Replaces BASE.power while this stick is equipped. */
  baseDamage: number;
  /** Hits per second; replaces BASE.swingRate while equipped. */
  attackSpeed: number;
  /** 0–1 crit chance added on top of crit upgrades. */
  critChance: number;
  /** 0–1 hue rotation of the shared stick albedo. */
  hue: number;
  cost: number;
}

export const DEFAULT_STICK_ID: StickId = "stick1";

export const STICKS: readonly StickDef[] = [
  {
    id: "stick1",
    name: "Base Stick",
    baseDamage: 1,
    attackSpeed: 0.75,
    critChance: 0,
    hue: 0,
    cost: 0,
  },
  {
    id: "stick2",
    name: "Stick 2",
    baseDamage: 5,
    attackSpeed: 1.6,
    critChance: 0,
    hue: 0.08,
    cost: 1000,
  },
  {
    id: "stick3",
    name: "Stick 3",
    baseDamage: 7,
    attackSpeed: 1.23,
    critChance: 0.15,
    hue: 0.3,
    cost: 4000,
  },
  {
    id: "stick4",
    name: "Stick 4",
    baseDamage: 24,
    attackSpeed: 1.31,
    critChance: 0,
    hue: 0.55,
    cost: 50000,
  },
  {
    id: "stick5",
    name: "Stick 5",
    baseDamage: 51,
    attackSpeed: 1.09,
    critChance: 0,
    hue: 0.72,
    cost: 250000,
  },
  {
    id: "stick6",
    name: "Stick 6",
    baseDamage: 100,
    attackSpeed: 1.09,
    critChance: 0,
    hue: 0.16,
    cost: 1000000,
  },
  {
    id: "stick7",
    name: "Stick 7",
    baseDamage: 167,
    attackSpeed: 1.09,
    critChance: 0.2,
    hue: 0.9,
    cost: 10000000,
  },
];

const STICK_BY_ID = new Map<StickId, StickDef>(STICKS.map((s) => [s.id, s]));

const STORAGE_KEY = "pinata-stick-shop-v1";

export interface StickShopSave {
  candy: number;
  owned: StickId[];
  equipped: StickId;
}

let equippedId: StickId = DEFAULT_STICK_ID;

export function isStickId(value: unknown): value is StickId {
  return typeof value === "string" && STICK_BY_ID.has(value as StickId);
}

export function stickById(id: string | undefined | null): StickDef {
  if (id && isStickId(id)) return STICK_BY_ID.get(id)!;
  return STICK_BY_ID.get(DEFAULT_STICK_ID)!;
}

export function getEquippedStick(): StickDef {
  return stickById(equippedId);
}

export function syncEquippedStick(id: StickId): StickDef {
  equippedId = stickById(id).id;
  return getEquippedStick();
}

export function stickHueCss(hue: number): string {
  const turns = ((hue % 1) + 1) % 1;
  if (turns < 1e-4) return "hsl(205 42% 58%)";
  return `hsl(${Math.round(turns * 360)} 72% 52%)`;
}

function defaultSave(): StickShopSave {
  return {
    candy: 0,
    owned: [DEFAULT_STICK_ID],
    equipped: DEFAULT_STICK_ID,
  };
}

export function loadStickShopSave(): StickShopSave {
  const fallback = defaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StickShopSave>;
    const owned = Array.isArray(parsed.owned)
      ? parsed.owned.filter(isStickId)
      : [];
    if (!owned.includes(DEFAULT_STICK_ID)) owned.unshift(DEFAULT_STICK_ID);
    const uniqueOwned = [...new Set(owned)];
    const equipped = isStickId(parsed.equipped) && uniqueOwned.includes(parsed.equipped)
      ? parsed.equipped
      : DEFAULT_STICK_ID;
    const candy = typeof parsed.candy === "number" && Number.isFinite(parsed.candy)
      ? Math.max(0, Math.floor(parsed.candy))
      : 0;
    return { candy, owned: uniqueOwned, equipped };
  } catch {
    return fallback;
  }
}

export function saveStickShopSave(save: StickShopSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearStickShopSave(): void {
  equippedId = DEFAULT_STICK_ID;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore private-mode failures.
  }
}
