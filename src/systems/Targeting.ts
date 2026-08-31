import * as THREE from "three";
import { BASE } from "../game/balance";
import { getPinataHitWorld, type PinataEntity } from "../world/PinataFactory";
import { dist2 } from "../util/math";

export class Targeting {
  locked: PinataEntity | null = null;
  /** All alive pinatas currently inside the hit radius (nearest-first). */
  inRange: PinataEntity[] = [];
  private lockTimer = 0;
  private readonly proj = new THREE.Vector3();
  private readonly hitWorld = new THREE.Vector3();
  private readonly edgeWorld = new THREE.Vector3();
  cursorNdc = new THREE.Vector2(0, 0);

  setCursor(clientX: number, clientY: number, width: number, height: number): void {
    this.cursorNdc.x = (clientX / width) * 2 - 1;
    this.cursorNdc.y = -((clientY / height) * 2 - 1);
  }

  update(
    dt: number,
    camera: THREE.Camera,
    pinatas: PinataEntity[],
    hitRadiusScalar: number,
    width: number,
    height: number,
  ): PinataEntity | null {
    this.lockTimer = Math.max(0, this.lockTimer - dt);

    const candidates: { p: PinataEntity; d2: number }[] = [];
    const cx = (this.cursorNdc.x * 0.5 + 0.5) * width;
    const cy = (-this.cursorNdc.y * 0.5 + 0.5) * height;

    for (const p of pinatas) {
      if (!p.alive) continue;

      // Aim at the visual mesh center, not the rope hang point.
      getPinataHitWorld(p, this.hitWorld);
      this.proj.copy(this.hitWorld);
      this.proj.project(camera);
      p.screen.set(
        (this.proj.x * 0.5 + 0.5) * width,
        (-this.proj.y * 0.5 + 0.5) * height,
        this.proj.z,
      );

      this.edgeWorld.copy(this.hitWorld);
      this.edgeWorld.x += p.hitRadiusWorld * hitRadiusScalar;
      this.edgeWorld.project(camera);
      const ex = (this.edgeWorld.x * 0.5 + 0.5) * width;
      const radiusPx = Math.abs(ex - p.screen.x);
      const d2 = dist2(cx, cy, p.screen.x, p.screen.y);
      if (d2 <= radiusPx * radiusPx) {
        candidates.push({ p, d2 });
      }
    }

    candidates.sort((a, b) => a.d2 - b.d2);
    this.inRange = candidates.map((c) => c.p);
    const best = candidates[0]?.p ?? null;

    if (this.locked && this.locked.alive && this.lockTimer > 0) {
      const still = candidates.find((c) => c.p.id === this.locked!.id);
      if (still) return this.locked;
    }

    if (best && (!this.locked || best.id !== this.locked.id)) {
      this.locked = best;
      this.lockTimer = BASE.targetLockMs / 1000;
    } else if (!best) {
      this.locked = null;
      this.lockTimer = 0;
    }

    return this.locked;
  }
}
