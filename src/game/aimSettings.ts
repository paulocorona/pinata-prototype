import { clamp } from "../util/math";

const STORAGE_KEY = "pinata-aim-v1";
/** Half of the original stick gain (4.6). Slider 100% maps here. */
const BASE_GAIN = 2.3;

export const AIM_SENSITIVITY_MIN = 0.25;
export const AIM_SENSITIVITY_MAX = 2;
export const AIM_SENSITIVITY_DEFAULT = 1;

export type AimMode = "joystick" | "slide";
export const AIM_MODE_DEFAULT: AimMode = "joystick";

type StoredAim = {
  sensitivity?: unknown;
  mode?: unknown;
};

function isAimMode(value: unknown): value is AimMode {
  return value === "joystick" || value === "slide";
}

function readStored(): StoredAim | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAim;
  } catch {
    return null;
  }
}

function loadSensitivity(): number {
  const parsed = readStored();
  return typeof parsed?.sensitivity === "number"
    ? clamp(parsed.sensitivity, AIM_SENSITIVITY_MIN, AIM_SENSITIVITY_MAX)
    : AIM_SENSITIVITY_DEFAULT;
}

function loadMode(): AimMode {
  const parsed = readStored();
  return isAimMode(parsed?.mode) ? parsed.mode : AIM_MODE_DEFAULT;
}

let sensitivity = loadSensitivity();
let mode = loadMode();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sensitivity, mode }));
  } catch {
    /* private mode / quota */
  }
}

export function getAimSensitivity(): number {
  return sensitivity;
}

export function setAimSensitivity(value: number): void {
  sensitivity = clamp(value, AIM_SENSITIVITY_MIN, AIM_SENSITIVITY_MAX);
  persist();
}

export function getAimMode(): AimMode {
  return mode;
}

export function setAimMode(value: AimMode): void {
  mode = value;
  persist();
}

export function getAimGain(): number {
  return BASE_GAIN * sensitivity;
}
