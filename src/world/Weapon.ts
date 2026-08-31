import * as THREE from "three";
import { CAMERA_DEFAULTS } from "../game/balance";
import { easeOutCubic } from "../util/math";
import { createStickMaterial, loadStickAssets, setStickHue } from "./stickAssets";

/** Handle sits this far along the look ray at impact — short lunge, not a throw. */
const STRIKE_DIST = 6.4;
/** Drop along camera-down — keep the handle low, tip on the piñatas. */
const HANDLE_DROP = 0.7;
/** Landing pose: 45° from world vertical, leaning toward the piñata. */
const END_FROM_VERTICAL = Math.PI / 4;
/** Radians cocked back from the landing pose. Small chop, not a full overhead. */
const WINDUP = 0.55;
/** Fraction of the swing spent reaching the pinata; the rest is the return. */
const SWING_OUT = 0.42;

export class Weapon {
  readonly group = new THREE.Group();
  private stick: THREE.Group;
  private stickMat: THREE.MeshStandardMaterial | null = null;
  private hue = 0;
  private swinging = false;
  private swingT = 0;
  private swingDur = 0.3;
  private posesDirty = false;

  private ndcX = 0;
  private ndcY = 0;
  private hasLockedTarget = false;

  private readonly lockedTarget = new THREE.Vector3(0, CAMERA_DEFAULTS.lookAtY, 0);
  private readonly worldTarget = new THREE.Vector3(0, CAMERA_DEFAULTS.lookAtY, 0);
  private readonly camPos = new THREE.Vector3();
  private readonly camRight = new THREE.Vector3();
  private readonly camUp = new THREE.Vector3();
  private readonly camBack = new THREE.Vector3();
  private readonly lookDir = new THREE.Vector3();
  private readonly stickDir = new THREE.Vector3();
  private readonly rayDir = new THREE.Vector3();
  private readonly yUp = new THREE.Vector3(0, 1, 0);

  private readonly restPos = new THREE.Vector3();
  private readonly strikePos = new THREE.Vector3();
  private readonly restLocal = new THREE.Vector3();
  private readonly strikeLocal = new THREE.Vector3();
  private readonly restQuat = new THREE.Quaternion();
  private readonly strikeQuat = new THREE.Quaternion();
  private readonly restQuatLocal = new THREE.Quaternion();
  private readonly strikeQuatLocal = new THREE.Quaternion();
  private readonly camQuat = new THREE.Quaternion();
  private readonly camQuatInv = new THREE.Quaternion();
  private readonly windupQuat = new THREE.Quaternion();

  constructor() {
    this.stick = new THREE.Group();
    this.group.add(this.stick);
    this.group.visible = false;
  }

  async load(renderer?: THREE.WebGLRenderer): Promise<void> {
    const assets = await loadStickAssets(renderer);
    const visual = assets.template.clone(true);
    const mat = createStickMaterial(assets, this.hue);
    this.stickMat = mat;
    visual.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = mat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    this.stick.add(visual);
  }

  setHue(hue: number): void {
    this.hue = hue;
    if (this.stickMat) setStickHue(this.stickMat, hue);
  }

  setAimFromScreen(ndcX: number, ndcY: number): void {
    this.ndcX = ndcX;
    this.ndcY = ndcY;
  }

  /** Prefer the locked piñata; otherwise the stick aims through the cursor. */
  setLockedTarget(world: THREE.Vector3 | null): void {
    this.hasLockedTarget = !!world;
    if (world) this.lockedTarget.copy(world);
  }

  startSwing(duration: number): void {
    this.swinging = true;
    this.swingT = 0;
    this.swingDur = Math.max(0.21, duration);
    this.posesDirty = true;
  }

  get isSwinging(): boolean {
    return this.swinging;
  }

  update(dt: number, camera: THREE.Camera): void {
    this.resolveAim(camera);
    camera.updateMatrixWorld();
    this.readCamera(camera);

    if (!this.swinging) {
      this.placeRest();
      this.group.visible = false;
      return;
    }

    if (this.posesDirty) {
      this.captureSwingPoses(camera);
      this.posesDirty = false;
    }

    this.swingT += dt;
    const t = Math.min(1, this.swingT / this.swingDur);
    const smash = this.swingAmount(t);
    this.group.position.lerpVectors(this.restLocal, this.strikeLocal, smash);
    camera.localToWorld(this.group.position);
    this.stick.quaternion.slerpQuaternions(this.restQuatLocal, this.strikeQuatLocal, smash);
    camera.getWorldQuaternion(this.camQuat);
    this.stick.quaternion.premultiply(this.camQuat);
    this.group.visible = smash > 0.02;

    if (t >= 1) {
      this.swinging = false;
      this.placeRest();
      this.group.visible = false;
    }
  }

  /** 0 behind the camera → 1 on the piñata → 0 back. */
  private swingAmount(t: number): number {
    if (t <= 0 || t >= 1) return 0;
    if (t < SWING_OUT) return easeOutCubic(t / SWING_OUT);
    const back = (t - SWING_OUT) / (1 - SWING_OUT);
    return 1 - back;
  }

  private readCamera(camera: THREE.Camera): void {
    camera.getWorldPosition(this.camPos);
    camera.matrixWorld.extractBasis(this.camRight, this.camUp, this.camBack);
  }

  private resolveAim(camera: THREE.Camera): void {
    if (this.hasLockedTarget) {
      this.worldTarget.copy(this.lockedTarget);
      return;
    }

    camera.getWorldPosition(this.camPos);
    this.rayDir.set(this.ndcX, this.ndcY, 0.5).unproject(camera).sub(this.camPos);
    if (Math.abs(this.rayDir.z) < 1e-5) {
      this.worldTarget.set(0, CAMERA_DEFAULTS.lookAtY, 0);
      return;
    }
    const dist = -this.camPos.z / this.rayDir.z;
    this.worldTarget.copy(this.camPos).addScaledVector(this.rayDir, dist);
    this.worldTarget.x = THREE.MathUtils.clamp(this.worldTarget.x, -5, 5);
    this.worldTarget.y = THREE.MathUtils.clamp(this.worldTarget.y, 2.5, 8);
    this.worldTarget.z = 0;
  }

  private placeRest(): void {
    this.restPos
      .copy(this.camPos)
      .addScaledVector(this.camBack, 1.35)
      .addScaledVector(this.camRight, 0.28)
      .addScaledVector(this.camUp, -0.2);
    this.group.position.copy(this.restPos);
    this.stick.quaternion.setFromUnitVectors(this.yUp, this.camBack);
  }

  private captureSwingPoses(camera: THREE.Camera): void {
    this.restPos
      .copy(this.camPos)
      .addScaledVector(this.camBack, 1.35)
      .addScaledVector(this.camRight, 0.28)
      .addScaledVector(this.camUp, -0.2);

    this.lookDir.copy(this.worldTarget).sub(this.camPos);
    if (this.lookDir.lengthSq() < 1e-8) this.lookDir.set(0, 0.26, -1);
    this.lookDir.normalize();
    this.strikePos.copy(this.camPos).addScaledVector(this.lookDir, STRIKE_DIST);
    this.strikePos.addScaledVector(this.camUp, -HANDLE_DROP);

    this.stickDir.copy(this.worldTarget).sub(this.strikePos);
    this.stickDir.y = 0;
    if (this.stickDir.lengthSq() < 1e-8) this.stickDir.set(0, 0, -1);
    else this.stickDir.normalize();
    const lean = Math.sin(END_FROM_VERTICAL);
    this.stickDir.x *= lean;
    this.stickDir.z *= lean;
    this.stickDir.y = Math.cos(END_FROM_VERTICAL);

    this.strikeQuat.setFromUnitVectors(this.yUp, this.stickDir);
    this.windupQuat.setFromAxisAngle(this.camRight, WINDUP);
    this.restQuat.copy(this.windupQuat).multiply(this.strikeQuat);

    this.restLocal.copy(this.restPos);
    this.strikeLocal.copy(this.strikePos);
    camera.worldToLocal(this.restLocal);
    camera.worldToLocal(this.strikeLocal);
    camera.getWorldQuaternion(this.camQuat);
    this.camQuatInv.copy(this.camQuat).invert();
    this.restQuatLocal.copy(this.camQuatInv).multiply(this.restQuat);
    this.strikeQuatLocal.copy(this.camQuatInv).multiply(this.strikeQuat);
  }
}
