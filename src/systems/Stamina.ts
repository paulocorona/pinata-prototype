import type { GameState } from "../game/GameState";

export class Stamina {
  update(state: GameState, dt: number): boolean {
    if (state.phase !== "roundActive") return false;
    const drain = Math.min(state.stamina, state.getDrainRate() * dt);
    state.stamina = Math.max(0, state.stamina - drain);
    state.staminaUsedThisRun += drain;
    return state.stamina <= 0;
  }
}
