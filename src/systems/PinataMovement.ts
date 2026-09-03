import * as THREE from "three";
import { MOVEMENT_DEFAULTS } from "../game/balance";
import {
  applyBurnTint,
  applyHitTint,
  applyLowHpOrIdleTint,
  HIT_MESH_DURATION,
  LOW_HP_FLASH_THRESHOLD,
  PINATA_SCALE,
  type PinataEntity,
} from "../world/PinataFactory";
import { ROPE_BEAM_Y, setRopeLength } from "../world/ropeAssets";

/** Overdamped rope catch so warmup drop-ins settle without a bounce. */
const DROP_SPRING = 36;
const DROP_DAMP = 14;

export class PinataMovement {
  horizontalSpeed = MOVEMENT_DEFAULTS.horizontalSpeed;
  verticalSpeed = MOVEMENT_DEFAULTS.verticalSpeed;
  travelRangeX = MOVEMENT_DEFAULTS.travelRangeX;
  travelRangeY = MOVEMENT_DEFAULTS.travelRangeY;
  overlapPadding = MOVEMENT_DEFAULTS.overlapPadding;
  boundMinX = MOVEMENT_DEFAULTS.boundMinX;
  boundMaxX = MOVEMENT_DEFAULTS.boundMaxX;
  boundMinY = MOVEMENT_DEFAULTS.boundMinY;
  boundMaxY = MOVEMENT_DEFAULTS.boundMaxY;
  /** World-space keep-out (joystick). Radius 0 disables. */
  avoidX = 0;
  avoidY = 0;
  avoidRadius = 0;

  private tmp = new THREE.Vector3();

  clearAvoid(): void {
    this.avoidRadius = 0;
  }

  setAvoid(x: number, y: number, radius: number): void {
    this.avoidX = x;
    this.avoidY = y;
    this.avoidRadius = Math.max(0, radius);
  }

  /** True when a hang-point would put a body over the keep-out. */
  blocksHome(x: number, y: number, bodyRadius: number): boolean {
    if (this.avoidRadius <= 0) return false;
    const dx = x - this.avoidX;
    const dy = y - bodyRadius * 0.9 - this.avoidY;
    const min = this.avoidRadius + bodyRadius;
    return dx * dx + dy * dy < min * min;
  }

  update(pinatas: PinataEntity[], dt: number, movementMultiplier: number): void {
    const hs = this.horizontalSpeed * movementMultiplier;
    const vs = this.verticalSpeed * movementMultiplier;

    for (const p of pinatas) {
      if (!p.alive) continue;
      p.phase += dt * p.speedMul;

      const dropping = p.dropY !== 0 || p.dropVelY !== 0;
      if (dropping) {
        p.dropVelY += (-DROP_SPRING * p.dropY - DROP_DAMP * p.dropVelY) * dt;
        p.dropY += p.dropVelY * dt;
        if (Math.abs(p.dropY) < 0.012 && Math.abs(p.dropVelY) < 0.08) {
          p.dropY = 0;
          p.dropVelY = 0;
        }
      }

      let ox = 0;
      let oy = 0;
      if (p.motionStyle === 0) {
        ox = Math.sin(p.phase * hs) * this.travelRangeX * 0.7;
        oy = Math.sin(p.phase * 0.7) * this.travelRangeY * 0.25;
      } else if (p.motionStyle === 1) {
        ox = Math.sin(p.phase * hs) * this.travelRangeX;
        oy = Math.sin(p.phase * vs * 1.3 + 1.2) * this.travelRangeY;
      } else {
        ox =
          Math.sin(p.phase * hs) * this.travelRangeX * 0.85 +
          Math.sin(p.phase * hs * 0.37 + 2) * this.travelRangeX * 0.25;
        oy =
          Math.cos(p.phase * vs * 1.1) * this.travelRangeY * 0.85 +
          Math.sin(p.phase * 0.5) * this.travelRangeY * 0.3;
      }

      this.tmp.set(p.home.x + ox, p.home.y + oy, p.home.z);

      // Soft separation: same-depth meshes can't share XY; layered ones may overlap on screen.
      for (const other of pinatas) {
        if (other === p || !other.alive) continue;
        const dz = this.tmp.z - other.group.position.z;
        const minZ = (p.bodyDepthWorld + other.bodyDepthWorld) * 0.5;
        if (Math.abs(dz) >= minZ) continue;
        const dx = this.tmp.x - other.group.position.x;
        const dy = this.tmp.y - other.group.position.y;
        const minDist = (p.bodyRadiusXY + other.bodyRadiusXY) * 1.05;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < minDist * minDist) {
          const d = Math.sqrt(d2);
          const push = ((minDist - d) / d) * 0.55;
          this.tmp.x += dx * push;
          this.tmp.y += dy * push;
        }
      }

      // Keep in shallow depth slab — no Z motion from home
      this.tmp.z = p.home.z;

      // Clamp to on-screen play bounds (account for body radius)
      const pad = p.hitRadiusWorld * 0.9;
      this.tmp.x = THREE.MathUtils.clamp(this.tmp.x, this.boundMinX + pad, this.boundMaxX - pad);
      this.tmp.y = THREE.MathUtils.clamp(this.tmp.y, this.boundMinY + pad, this.boundMaxY - pad);
      this.repelFromAvoid(p.bodyRadiusXY);
      this.tmp.x = THREE.MathUtils.clamp(this.tmp.x, this.boundMinX + pad, this.boundMaxX - pad);
      this.tmp.y = THREE.MathUtils.clamp(this.tmp.y, this.boundMinY + pad, this.boundMaxY - pad);
      this.tmp.y += p.dropY;

      p.group.position.lerp(this.tmp, 1 - Math.exp(-8 * dt));
      if (dropping) p.group.position.y = this.tmp.y;

      if (p.squash > 0) p.squash = Math.max(0, p.squash - dt * 6);
      else p.squash = Math.min(0, p.squash + dt * 4.2);
      const sq = PINATA_SCALE * (1 - p.squash * 0.18);
      const tall = PINATA_SCALE * (1 + p.squash * 0.12);
      p.body.scale.set(sq, tall, sq);

      // Spring pendulum around the rope join. Idle stays upright; hits kick it sideways.
      p.swingVel += (-80 * p.swing - 9.2 * p.swingVel) * dt;
      p.swing += p.swingVel * dt;
      p.body.rotation.z = p.swing;
      p.body.position.set(
        p.hangOffset.x * p.body.scale.x,
        p.hangOffset.y * p.body.scale.y,
        p.hangOffset.z * p.body.scale.z,
      );

      // Rope stays vertical at the join; it does not rotate with the pinata.
      p.rope.position.copy(p.body.position);
      const ropeLen = Math.max(0.4, ROPE_BEAM_Y - (p.group.position.y + p.rope.position.y));
      setRopeLength(p.rope, ropeLen);
      const lowHp = p.maxHp > 0 && p.hp / p.maxHp <= LOW_HP_FLASH_THRESHOLD;
      if (lowHp) p.lowHpFlashT += dt;
      else p.lowHpFlashT = 0;

      if (p.hitMeshTimer > 0) {
        applyHitTint(p.bodyMat, p.hitMeshTimer / HIT_MESH_DURATION, p.glowing);
        p.hitMeshTimer = Math.max(0, p.hitMeshTimer - dt);
        if (p.hitMeshTimer <= 0) {
          p.idleVisual.visible = true;
          p.hitVisual.visible = false;
          if (p.burnRemaining > 0) applyBurnTint(p);
          else applyLowHpOrIdleTint(p);
        }
      } else if (p.burnRemaining > 0) {
        applyBurnTint(p);
      } else {
        applyLowHpOrIdleTint(p);
      }
    }
  }

  /** Push hanging bodies out of a world-space keep-out (mobile joystick). */
  private repelFromAvoid(bodyRadius: number): void {
    if (this.avoidRadius <= 0) return;
    const bodyY = this.tmp.y - bodyRadius * 0.9;
    const dx = this.tmp.x - this.avoidX;
    const dy = bodyY - this.avoidY;
    const minDist = this.avoidRadius + bodyRadius;
    const d2 = dx * dx + dy * dy;
    if (d2 >= minDist * minDist) return;
    const d = Math.sqrt(d2);
    if (d < 1e-5) {
      this.tmp.y += minDist;
      return;
    }
    const push = (minDist - d) / d;
    this.tmp.x += dx * push;
    this.tmp.y += dy * push;
    if (dy < 0) this.tmp.y += minDist - d;
  }
}
