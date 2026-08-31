import * as THREE from "three";
import { CAMERA_DEFAULTS } from "../game/balance";

export class CameraRig {
  readonly perspective: THREE.PerspectiveCamera;
  readonly orthographic: THREE.OrthographicCamera;
  useOrthographic = CAMERA_DEFAULTS.orthographic;
  fov = CAMERA_DEFAULTS.fov;
  height = CAMERA_DEFAULTS.height;
  distance = CAMERA_DEFAULTS.distance;
  lookAtY = CAMERA_DEFAULTS.lookAtY;
  orthoSize = CAMERA_DEFAULTS.orthoSize;

  private lookTarget = new THREE.Vector3(0, CAMERA_DEFAULTS.lookAtY, 0);
  private impulse = new THREE.Vector3();
  private shake = 0;
  private shakeTime = 0;
  private readonly ndcPoint = new THREE.Vector3();
  private readonly planeHit = new THREE.Vector3();

  constructor(aspect: number) {
    this.perspective = new THREE.PerspectiveCamera(this.fov, aspect, 0.1, 200);
    this.orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.applyAspect(aspect);
    this.syncPose();
  }

  get active(): THREE.Camera {
    return this.useOrthographic ? this.orthographic : this.perspective;
  }

  applyAspect(aspect: number): void {
    this.perspective.aspect = aspect;
    this.perspective.fov = this.fov;
    this.perspective.updateProjectionMatrix();

    const h = this.orthoSize;
    const w = h * aspect;
    this.orthographic.left = -w;
    this.orthographic.right = w;
    this.orthographic.top = h;
    this.orthographic.bottom = -h;
    this.orthographic.updateProjectionMatrix();
    this.syncPose();
    this.perspective.updateMatrixWorld(true);
    this.orthographic.updateMatrixWorld(true);
  }

  syncPose(): void {
    const y = this.height;
    const z = this.distance;
    this.perspective.position.set(0, y, z);
    this.orthographic.position.set(0, y, z);
    this.lookTarget.set(0, this.lookAtY, 0);
    this.perspective.lookAt(this.lookTarget);
    this.orthographic.lookAt(this.lookTarget);
  }

  /**
   * World XY AABB of hang-points that stay inside the camera frame at play depth.
   * `ndc` is the allowed NDC box (inset from the full -1..1 screen).
   */
  playBoundsAtZ(
    planeZ: number,
    ndc: { minX: number; maxX: number; minY: number; maxY: number } = {
      minX: -0.92,
      maxX: 0.92,
      minY: -0.52,
      maxY: 0.58,
    },
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    this.active.updateMatrixWorld(true);
    const corners = [
      this.intersectZ(ndc.minX, ndc.minY, planeZ),
      this.intersectZ(ndc.maxX, ndc.minY, planeZ),
      this.intersectZ(ndc.minX, ndc.maxY, planeZ),
      this.intersectZ(ndc.maxX, ndc.maxY, planeZ),
    ];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of corners) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, maxX, minY, maxY };
  }

  private intersectZ(ndcX: number, ndcY: number, planeZ: number): THREE.Vector3 {
    const cam = this.active;
    this.ndcPoint.set(ndcX, ndcY, 0.5).unproject(cam);
    const ox = cam.position.x;
    const oy = cam.position.y;
    const oz = cam.position.z;
    const dz = this.ndcPoint.z - oz;
    const t = Math.abs(dz) < 1e-6 ? 0 : (planeZ - oz) / dz;
    this.planeHit.set(
      ox + (this.ndcPoint.x - ox) * t,
      oy + (this.ndcPoint.y - oy) * t,
      planeZ,
    );
    return this.planeHit.clone();
  }

  addImpulse(amount = 0.08): void {
    this.impulse.y -= amount;
    this.shake = Math.max(this.shake, amount * 1.6);
  }

  update(dt: number): void {
    this.impulse.multiplyScalar(Math.exp(-14 * dt));
    this.shake *= Math.exp(-9 * dt);
    this.shakeTime += dt;
    const cam = this.active;
    const s = this.shake;
    cam.position.set(
      Math.sin(this.shakeTime * 64) * s,
      this.height + this.impulse.y + Math.cos(this.shakeTime * 81) * s * 0.55,
      this.distance,
    );
    cam.lookAt(this.lookTarget);
  }
}
