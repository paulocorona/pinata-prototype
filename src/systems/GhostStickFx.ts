import * as THREE from "three";
import { easeOutCubic } from "../util/math";
import { rng } from "../util/rng";
import { loadStickAssets, STICK_UNIT_HEIGHT } from "../world/stickAssets";

interface GhostSwing {
  root: THREE.Group;
  mats: THREE.Material[];
  life: number;
  maxLife: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
  target: THREE.Vector3;
}

/** Translucent stick that chops onto a piñata when Ghost Stick procs. */
export class GhostStickFx {
  readonly group = new THREE.Group();
  private swings: GhostSwing[] = [];
  private template: THREE.Group | null = null;
  private ghostMat: THREE.MeshBasicMaterial | null = null;
  private readonly yUp = new THREE.Vector3(0, 1, 0);
  private readonly dir = new THREE.Vector3();

  async load(renderer?: THREE.WebGLRenderer): Promise<void> {
    const assets = await loadStickAssets(renderer);
    this.template = assets.template;
    this.ghostMat = new THREE.MeshBasicMaterial({
      map: assets.map,
      color: 0xc5e8ff,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
  }

  strike(target: THREE.Vector3): void {
    if (!this.template || !this.ghostMat) return;

    const visual = this.template.clone(true);
    const mats: THREE.Material[] = [];
    visual.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = this.ghostMat!.clone();
      mesh.material = mat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mats.push(mat);
    });

    const start = target.clone();
    start.x += rng.range(-0.85, 0.85);
    start.y += rng.range(1.35, 1.85);
    start.z += rng.range(0.55, 1.15);

    const end = target.clone();
    end.y += 0.12;
    end.z += 0.2;

    const root = new THREE.Group();
    visual.position.y = -STICK_UNIT_HEIGHT * 0.82;
    root.add(visual);
    root.position.copy(start);
    this.aimAt(root, target);
    this.group.add(root);

    this.swings.push({
      root,
      mats,
      life: 0.32,
      maxLife: 0.32,
      start,
      end,
      target: target.clone(),
    });
  }

  update(dt: number): void {
    for (let i = this.swings.length - 1; i >= 0; i--) {
      const s = this.swings[i]!;
      s.life -= dt;
      const t = 1 - Math.max(0, s.life) / s.maxLife;
      const smash = t < 0.55 ? easeOutCubic(t / 0.55) : 1 - (t - 0.55) / 0.45;
      s.root.position.lerpVectors(s.start, s.end, Math.min(1, smash));
      this.aimAt(s.root, s.target);
      const fade = t < 0.7 ? 0.62 : Math.max(0, 0.62 * (1 - (t - 0.7) / 0.3));
      for (const mat of s.mats) {
        (mat as THREE.MeshBasicMaterial).opacity = fade;
      }
      if (s.life <= 0) {
        this.group.remove(s.root);
        for (const mat of s.mats) mat.dispose();
        this.swings.splice(i, 1);
      }
    }
  }

  private aimAt(root: THREE.Group, target: THREE.Vector3): void {
    this.dir.copy(target).sub(root.position);
    if (this.dir.lengthSq() < 1e-8) this.dir.set(0, -1, 0);
    this.dir.normalize();
    root.quaternion.setFromUnitVectors(this.yUp, this.dir);
  }
}
