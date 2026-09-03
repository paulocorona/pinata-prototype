import * as THREE from "three";
import { BASE } from "../game/balance";
import { Pool } from "../util/pool";
import { rng } from "../util/rng";
import type { Arena } from "../world/Arena";

interface Particle {
  mesh: THREE.Mesh;
  litMat: THREE.MeshStandardMaterial;
  confettiMat: THREE.MeshBasicMaterial;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  spin: number;
  collide: boolean;
  grounded: boolean;
  collectable: boolean;
  payout: number;
  colorHex: number;
  collectWait: number;
  baseScale: number;
}

export type CandyCollect = {
  x: number;
  y: number;
  z: number;
  color: number;
  payout: number;
};

const CANDY_COLORS = [0xff4d8a, 0xff9f1c, 0x2ec4b6, 0xffd166, 0x7b61ff, 0xffffff];
/** Saturated rainbow from T_Logo.png (piñata stripes + lettering). */
const LOGO_CONFETTI_COLORS = [0xf419a1, 0xf38605, 0xfddd04, 0x40e50e, 0x03aafc, 0x8c0ef7];
const RESTITUTION = 0.46;
const FRICTION = 0.85;
const SETTLE_SPEED = 0.55;
const CANDY_RADIUS = 0.07;
/** Seconds after a smash burst before cubes fly to the HUD. */
const COLLECT_DELAY = 1;

function splitPayout(total: number, n: number): number[] {
  const amounts = new Array<number>(n).fill(0);
  if (n <= 0 || total <= 0) return amounts;
  const base = Math.floor(total / n);
  let rem = total - base * n;
  for (let i = 0; i < n; i++) {
    amounts[i] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
  }
  return amounts;
}

export class CandyBurst {
  readonly group = new THREE.Group();
  onCollect: ((piece: CandyCollect) => void) | null = null;
  private active: Particle[] = [];
  private pool: Pool<Particle>;
  private sharedGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private confettiGeo = new THREE.BoxGeometry(0.12, 0.2, 0.02);
  private readonly bounceVel = new THREE.Vector3();

  constructor() {
    this.pool = new Pool(
      () => this.createParticle(),
      (p) => {
        p.active = false;
        p.life = 0;
        p.collide = false;
        p.grounded = false;
        p.collectable = false;
        p.payout = 0;
        p.colorHex = 0xffffff;
        p.collectWait = 0;
        p.mesh.visible = false;
        p.vel.set(0, 0, 0);
      },
      80,
    );
  }

  private createParticle(): Particle {
    const litMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const confettiMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(this.sharedGeo, litMat);
    mesh.visible = false;
    mesh.castShadow = false;
    this.group.add(mesh);
    return {
      mesh,
      litMat,
      confettiMat,
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      active: false,
      spin: 0,
      collide: false,
      grounded: false,
      collectable: false,
      payout: 0,
      colorHex: 0xffffff,
      collectWait: 0,
      baseScale: 1,
    };
  }

  /** Smash loot cubes. Returns candy that could not be assigned to a particle. */
  burst(origin: THREE.Vector3, count: number, explosive = false, payout = 0): number {
    const n = Math.min(count, BASE.particleCap - this.active.length);
    const amounts = splitPayout(payout, n);
    for (let i = 0; i < n; i++) {
      const p = this.pool.acquire();
      p.mesh.geometry = this.sharedGeo;
      p.mesh.material = p.litMat;
      p.colorHex = rng.pick(CANDY_COLORS);
      p.litMat.color.setHex(p.colorHex);
      p.mesh.position.copy(origin);
      p.mesh.position.x += rng.range(-0.2, 0.2);
      p.mesh.position.y += rng.range(-0.1, 0.3);
      const speed = explosive ? rng.range(3.5, 7.5) : rng.range(1.5, 3.5);
      const theta = rng.range(0, Math.PI * 2);
      const phi = rng.range(0.15, Math.PI * 0.65);
      p.vel.set(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.cos(phi) * speed + (explosive ? 2 : 0.5),
        Math.sin(theta) * Math.sin(phi) * speed * 0.35,
      );
      p.maxLife = rng.range(0.55, 1.2);
      p.life = p.maxLife;
      p.spin = rng.range(-10, 10);
      p.collide = true;
      p.grounded = false;
      p.collectable = true;
      p.payout = amounts[i] ?? 0;
      p.collectWait = COLLECT_DELAY;
      p.baseScale = rng.range(0.7, 1.3);
      p.active = true;
      p.mesh.visible = true;
      p.mesh.scale.setScalar(p.baseScale);
      this.active.push(p);
    }
    return n <= 0 ? payout : 0;
  }

  /** Paper scraps on hit — shrink to 0 over ~0.3s and never land as candy. */
  confetti(origin: THREE.Vector3): void {
    const n = Math.min(rng.int(10, 16), BASE.particleCap - this.active.length);
    for (let i = 0; i < n; i++) {
      const p = this.pool.acquire();
      p.mesh.geometry = this.confettiGeo;
      p.mesh.material = p.confettiMat;
      p.confettiMat.color.setHex(rng.pick(LOGO_CONFETTI_COLORS));
      p.mesh.position.copy(origin);
      p.mesh.position.x += rng.range(-0.12, 0.12);
      p.mesh.position.y += rng.range(-0.08, 0.18);
      p.mesh.position.z += rng.range(0.18, 0.4);
      p.mesh.rotation.set(rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2));
      const speed = rng.range(1.6, 3.4);
      const theta = rng.range(0, Math.PI * 2);
      const phi = rng.range(0.2, Math.PI * 0.7);
      p.vel.set(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.cos(phi) * speed + 0.9,
        Math.sin(theta) * Math.sin(phi) * speed * 0.55,
      );
      p.mesh.position.addScaledVector(p.vel, 0.05);
      p.maxLife = rng.range(0.26, 0.34);
      p.life = p.maxLife;
      p.spin = rng.range(-18, 18);
      p.collide = false;
      p.grounded = false;
      p.collectable = false;
      p.payout = 0;
      p.collectWait = 0;
      p.baseScale = rng.range(1.05, 1.7);
      p.active = true;
      p.mesh.visible = true;
      p.mesh.scale.setScalar(p.baseScale);
      this.active.push(p);
    }
  }

  /** A single falling shard for Shard Rain. */
  rock(from: THREE.Vector3, to: THREE.Vector3): void {
    if (this.active.length >= BASE.particleCap) return;
    const p = this.pool.acquire();
    p.mesh.geometry = this.sharedGeo;
    p.mesh.material = p.litMat;
    p.litMat.color.setHex(rng.pick([0x8a6a4a, 0x6b5344, 0xa89070, 0x5c4638]));
    p.mesh.position.copy(from);
    p.vel.copy(to).sub(from).multiplyScalar(2.4);
    p.vel.x += rng.range(-0.4, 0.4);
    p.vel.z += rng.range(-0.2, 0.2);
    p.maxLife = rng.range(0.28, 0.48);
    p.life = p.maxLife;
    p.spin = rng.range(-14, 14);
    p.collide = false;
    p.grounded = false;
    p.collectable = false;
    p.payout = 0;
    p.collectWait = 0;
    p.baseScale = rng.range(1.1, 1.8);
    p.active = true;
    p.mesh.visible = true;
    p.mesh.scale.setScalar(p.baseScale);
    this.active.push(p);
  }

  /** Candy falling from above a break — used when Candy Rain bursts. */
  rain(origin: THREE.Vector3, count: number, payout = 0): number {
    const n = Math.min(count, BASE.particleCap - this.active.length);
    const amounts = splitPayout(payout, n);
    const sky = origin.clone();
    sky.y += 3.4;
    for (let i = 0; i < n; i++) {
      const p = this.pool.acquire();
      p.mesh.geometry = this.sharedGeo;
      p.mesh.material = p.litMat;
      p.colorHex = rng.pick(CANDY_COLORS);
      p.litMat.color.setHex(p.colorHex);
      p.mesh.position.set(
        sky.x + rng.range(-1.6, 1.6),
        sky.y + rng.range(0, 1.2),
        sky.z + rng.range(-0.4, 0.4),
      );
      p.vel.set(rng.range(-0.6, 0.6), rng.range(-1.2, 0.4), rng.range(-0.25, 0.25));
      p.maxLife = rng.range(0.85, 1.5);
      p.life = p.maxLife;
      p.spin = rng.range(-12, 12);
      p.collide = true;
      p.grounded = false;
      p.collectable = true;
      p.payout = amounts[i] ?? 0;
      p.collectWait = COLLECT_DELAY;
      p.baseScale = rng.range(0.85, 1.45);
      p.active = true;
      p.mesh.visible = true;
      p.mesh.scale.setScalar(p.baseScale);
      this.active.push(p);
    }
    return n <= 0 ? payout : 0;
  }

  update(dt: number, arena?: Arena, collectDt = dt): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]!;
      if (p.collectable) p.collectWait -= collectDt;
      else if (p.grounded || !p.collide) p.life -= dt;
      if (!p.grounded) {
        p.vel.y -= 9.5 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += p.spin * dt;
        p.mesh.rotation.z += p.spin * 0.7 * dt;
      } else {
        p.vel.multiplyScalar(Math.exp(-6 * dt));
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.mesh.rotation.y += p.spin * 0.15 * dt;
      }

      if (p.collide && arena) this.collideFloor(p, arena);

      if (!p.collide) {
        const t = Math.max(0.01, p.life / p.maxLife);
        p.mesh.scale.setScalar(p.baseScale * t);
      } else {
        p.mesh.scale.setScalar(p.baseScale);
      }

      const fallenOff = p.mesh.position.y < -1;
      const collectDue = p.collectable && p.collectWait <= 0;
      if (collectDue || fallenOff || (!p.collectable && p.life <= 0)) {
        if (p.collectable) this.emitCollect(p);
        this.releaseAt(i);
      }
    }
  }

  /** Skip the floor wait and send every collectable cube to the HUD. */
  harvest(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]!;
      if (!p.collectable) continue;
      this.emitCollect(p);
      this.releaseAt(i);
    }
  }

  clear(): void {
    for (let i = this.active.length - 1; i >= 0; i--) this.releaseAt(i);
  }

  private emitCollect(p: Particle): void {
    this.onCollect?.({
      x: p.mesh.position.x,
      y: p.mesh.position.y,
      z: p.mesh.position.z,
      color: p.colorHex,
      payout: p.payout,
    });
  }

  private releaseAt(index: number): void {
    const p = this.active[index];
    if (!p) return;
    p.mesh.visible = false;
    p.active = false;
    this.pool.release(p);
    this.active.splice(index, 1);
  }

  private collideFloor(p: Particle, arena: Arena): void {
    const { x, y, z } = p.mesh.position;
    if (!arena.onFloor(x, z)) return;
    const floorY = arena.floorHeightAt(x, z);
    const limit = floorY + CANDY_RADIUS * p.baseScale;
    if (y > limit) return;

    p.mesh.position.y = limit;
    const n = arena.floorNormal;
    const vn = p.vel.dot(n);
    if (vn < 0) {
      this.bounceVel.copy(p.vel).addScaledVector(n, -(1 + RESTITUTION) * vn);
      this.bounceVel.x *= FRICTION;
      this.bounceVel.z *= FRICTION;
      p.vel.copy(this.bounceVel);
    }

    const speed = p.vel.length();
    if (speed < SETTLE_SPEED) {
      p.vel.set(0, 0, 0);
      if (!p.grounded) {
        p.grounded = true;
        p.spin *= 0.15;
      }
    }
  }

  get activeCount(): number {
    return this.active.length;
  }
}
