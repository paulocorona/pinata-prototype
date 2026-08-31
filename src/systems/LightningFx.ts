import * as THREE from "three";
import { rng } from "../util/rng";

interface Arc {
  line: THREE.Line;
  life: number;
  maxLife: number;
}

interface Pulse {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class LightningFx {
  readonly group = new THREE.Group();
  private arcs: Arc[] = [];
  private pulses: Pulse[] = [];
  private readonly side = new THREE.Vector3();
  private readonly dir = new THREE.Vector3();

  zap(from: THREE.Vector3, to: THREE.Vector3): void {
    this.spawnBolt(from, to, 0xb8f3ff, 1);
    this.spawnBolt(from, to, 0x7ec8ff, 0.7);
  }

  private spawnBolt(from: THREE.Vector3, to: THREE.Vector3, color: number, scale: number): void {
    const segments = 8;
    const positions = new Float32Array((segments + 1) * 3);
    this.dir.copy(to).sub(from);
    const len = this.dir.length();
    this.side.set(-this.dir.y, this.dir.x, 0);
    if (this.side.lengthSq() < 1e-6) this.side.set(1, 0, 0);
    this.side.normalize();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const jitter =
        i === 0 || i === segments ? 0 : rng.range(-0.32, 0.32) * scale * (0.4 + len * 0.07);
      positions[i * 3] = from.x + this.dir.x * t + this.side.x * jitter;
      positions[i * 3 + 1] = from.y + this.dir.y * t + this.side.y * jitter;
      positions[i * 3 + 2] = from.z + this.dir.z * t + rng.range(-0.1, 0.1) * scale;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 8;
    this.group.add(line);
    this.arcs.push({ line, life: 0.18, maxLife: 0.18 });
  }

  shockwave(origin: THREE.Vector3): void {
    this.spawnRing(origin, 0xffc14d, 0.28, 0.55, 0.9);
    this.spawnRing(origin, 0xfff0c8, 0.12, 0.32, 0.7);
  }

  private spawnRing(
    origin: THREE.Vector3,
    color: number,
    inner: number,
    outer: number,
    opacity: number,
  ): void {
    const geo = new THREE.RingGeometry(inner, outer, 40);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.renderOrder = 7;
    this.group.add(mesh);
    this.pulses.push({ mesh, life: 0.34, maxLife: 0.34 });
  }

  update(dt: number): void {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i]!;
      a.life -= dt;
      const mat = a.line.material as THREE.LineBasicMaterial;
      mat.opacity = Math.max(0, a.life / a.maxLife);
      if (a.life <= 0) {
        this.group.remove(a.line);
        a.line.geometry.dispose();
        mat.dispose();
        this.arcs.splice(i, 1);
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i]!;
      p.life -= dt;
      const t = 1 - Math.max(0, p.life) / p.maxLife;
      const scale = 0.35 + t * 6.5;
      p.mesh.scale.set(scale, scale, 1);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - t);
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.pulses.splice(i, 1);
      }
    }
  }
}
