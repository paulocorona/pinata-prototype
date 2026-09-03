/**
 * Permanent upgrades bought with Tickets after a loss.
 * Display names may change; keep `id` stable.
 */
export interface TicketUpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  /** Ticket cost for each purchase (index = current level). */
  costs: readonly number[];
}

/** Effect magnitudes for owned rings (level ≥ 1). */
export const TICKET_RING = {
  damage: 2,
  stamina: 10,
  pinatas: 2,
  loot: 0.1,
  critChance: 0.1,
  critDamage: 0.5,
} as const;

export const TICKET_UPGRADES: readonly TicketUpgradeDef[] = [
  {
    id: "damageRing",
    name: "Damage Ring",
    description: "+2 damage.",
    maxLevel: 1,
    costs: [1],
  },
  {
    id: "staminaRing",
    name: "Stamina Ring",
    description: "Max stamina increases by 10.",
    maxLevel: 1,
    costs: [4],
  },
  {
    id: "pinataRing",
    name: "Pinata Ring",
    description: "Each run starts with 2 extra pinatas.",
    maxLevel: 1,
    costs: [15],
  },
  {
    id: "lootRing",
    name: "Loot Ring",
    description: "Pinata loot is 10% higher.",
    maxLevel: 1,
    costs: [30],
  },
  {
    id: "critRing",
    name: "Crit Ring",
    description: "Gain 10% crit chance and 50% crit damage.",
    maxLevel: 1,
    costs: [50],
  },
];

const TICKET_UPGRADE_IDS = new Set(TICKET_UPGRADES.map((u) => u.id));

const STORAGE_KEY = "pinata-ticket-shop-v1";

export interface TicketShopSave {
  tickets: number;
  upgrades: Record<string, number>;
  /** 1-based run the player is currently on (persists across sessions). */
  runNumber: number;
}

export function emptyTicketUpgradeLevels(): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const def of TICKET_UPGRADES) levels[def.id] = 0;
  return levels;
}

function clampInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function defaultSave(): TicketShopSave {
  return {
    tickets: 0,
    upgrades: emptyTicketUpgradeLevels(),
    runNumber: 1,
  };
}

export function ticketUpgradeById(id: string): TicketUpgradeDef | undefined {
  return TICKET_UPGRADES.find((u) => u.id === id);
}

export function loadTicketShopSave(): TicketShopSave {
  const fallback = defaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TicketShopSave>;
    const upgrades = emptyTicketUpgradeLevels();
    if (parsed.upgrades && typeof parsed.upgrades === "object") {
      for (const [id, level] of Object.entries(parsed.upgrades)) {
        if (!TICKET_UPGRADE_IDS.has(id)) continue;
        const def = ticketUpgradeById(id);
        if (!def) continue;
        upgrades[id] = Math.min(def.maxLevel, clampInt(level));
      }
    }
    return {
      tickets: clampInt(parsed.tickets),
      upgrades,
      runNumber: Math.max(1, clampInt(parsed.runNumber)),
    };
  } catch {
    return fallback;
  }
}

export function saveTicketShopSave(save: TicketShopSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearTicketShopSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore private-mode failures.
  }
}
