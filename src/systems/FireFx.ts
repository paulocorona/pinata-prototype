import * as THREE from "three";
import { rng } from "../util/rng";
import { getPinataHitWorld, type PinataEntity } from "../world/PinataFactory";

interface Ember {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

const FIRE_COLORS = [0xff3b1f, 0xff7a18, 0xffd166, 0xff9f1c] as const;

export class FireFx {
  readonly group = new THREE.Group();
  private embers: Ember[] = [];
  private geo = new THREE.SphereGeometry(0.08, 6, 6);
  private spawnAcc = 0;

  update(dt: number, pinatas: PinataEntity[]): void {
    this.spawnAcc += dt;
    const interval = 0.05;
    while (this.spawnAcc >= interval) {
      this.spawnAcc -= interval;
      for (const p of pinatas) {
        if (!p.alive || p.burnRemaining <= 0) continue;
        this.spawnEmber(getPinataHitWorld(p));
      }
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i]!;
      e.life -= dt;
      e.vel.y += 2.8 * dt;
      e.mesh.position.addScaledVector(e.vel, dt);
      const t = Math.max(0, e.life / e.maxLife);
      e.mesh.scale.setScalar(0.35 + t * 0.85);
      const mat = e.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = t * 0.9;
      if (e.life <= 0) {
        this.group.remove(e.mesh);
        mat.dispose();
        this.embers.splice(i, 1);
      }
    }
  }

  private spawnEmber(origin: THREE.Vector3): void {
    if (this.embers.length >= 90) return;
    const mat = new THREE.MeshBasicMaterial({
      color: rng.pick(FIRE_COLORS),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.position.copy(origin);
    mesh.position.x += rng.range(-0.28, 0.28);
    mesh.position.y += rng.range(-0.22, 0.18);
    mesh.position.z += rng.range(-0.12, 0.18);
    mesh.renderOrder = 6;
    this.group.add(mesh);
    const life = rng.range(0.28, 0.55);
    this.embers.push({
      mesh,
      vel: new THREE.Vector3(rng.range(-0.35, 0.35), rng.range(0.9, 2.2), rng.range(-0.2, 0.2)),
      life,
      maxLife: life,
    });
  }
}
