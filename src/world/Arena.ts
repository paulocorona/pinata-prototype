import * as THREE from "three";
import { assetUrl } from "../util/assetUrl";

/** Play-depth Z of hanging pinatas. */
export const PLAY_Z = -2.2;
/**
 * Floor height under the pinatas. Chosen so the physics plane sits on the
 * painted terracotta tiles (~12% up from the bottom of the portrait frame).
 */
const FLOOR_Y_AT_PLAY = 3.54;
/**
 * dy/dz. Negative so candy sliding toward the camera stays on the foreground
 * tiles, and candy sliding away rises toward the teal wall-ledge (~24.5% up).
 */
const FLOOR_SLOPE_Z = -0.35;

const FLOOR_Z_NEAR = 8;
const FLOOR_Z_FAR = -52;
const FLOOR_WIDTH = 64;

const FLOOR_NORMAL = new THREE.Vector3(0, 1, -FLOOR_SLOPE_Z).normalize();

const BACKDROP_URL = assetUrl("art/courtyard.jpg");
/** Source image width / height — used to cover the portrait view. */
const BACKDROP_ASPECT = 471 / 1024;
const BACKDROP_DIST = 80;

/**
 * Vertical wall just behind the pinatas. Receives live shadows so they sit
 * on the painted stucco like the baked banner / arch shade.
 */
export const WALL_Z = -3.55;
const CATCHER_WIDTH = 14;
/**
 * courtyard.jpg fractions from the bottom of the image. The catcher plane is
 * fitted through these so it sits on the painted tiles, not the physics ramp.
 */
const FLOOR_LEDGE_IMAGE_FRAC = 0.21;
const FLOOR_PLAY_IMAGE_FRAC = 0.12;
/** Translucent catchers so the wall/floor split can be lined up by eye. */
const DEBUG_CATCHERS = false;
/** Extra wall catcher height above the top of the view at WALL_Z. */
const WALL_CATCHER_TOP_PAD = 0.6;
/** Extra floor catcher depth past the bottom of the view, toward the camera. */
const FLOOR_CATCHER_NEAR_PAD = 1.4;

const CATCHER_Z_AXIS = new THREE.Vector3(0, 0, 1);
const CATCHER_Y_AXIS = new THREE.Vector3(0, 1, 0);
const _ndc = new THREE.Vector3();

export class Arena {
  readonly group = new THREE.Group();
  /** Unit normal of the courtyard plane (faces upward / toward camera). */
  readonly floorNormal = FLOOR_NORMAL.clone();
  private backdrop: THREE.Mesh | null = null;
  private catchers: THREE.Object3D[] = [];

  /** Painted courtyard backdrop + wall/floor shadow catchers + invisible bounce floor. */
  async load(camera: THREE.PerspectiveCamera): Promise<void> {
    await this.loadBackdrop(camera);
    this.buildCatchers(camera);
  }

  /** Keep the backdrop covering the portrait view after a resize. */
  syncBackdrop(camera: THREE.PerspectiveCamera): void {
    if (!this.backdrop) return;
    fitBackdrop(this.backdrop, camera);
    if (this.catchers.length) this.buildCatchers(camera);
  }

  /** Height of the courtyard at world XZ. */
  floorHeightAt(_x: number, z: number): number {
    return FLOOR_Y_AT_PLAY + FLOOR_SLOPE_Z * (z - PLAY_Z);
  }

  /** True when XZ is over the bounce plane. */
  onFloor(x: number, z: number): boolean {
    const halfW = FLOOR_WIDTH * 0.5;
    return x >= -halfW && x <= halfW && z <= FLOOR_Z_NEAR && z >= FLOOR_Z_FAR;
  }

  private buildCatchers(camera: THREE.PerspectiveCamera): void {
    const leftover = new Set<THREE.Material>();
    for (const obj of this.catchers) {
      this.group.remove(obj);
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => leftover.add(m));
      else if (mat) leftover.add(mat);
    }
    leftover.forEach((m) => m.dispose());
    this.catchers = [];
    camera.updateMatrixWorld(true);
    const ledge = unprojectAtZ(
      camera,
      0,
      ndcYFromImageFrac(FLOOR_LEDGE_IMAGE_FRAC, camera),
      WALL_Z,
    );
    const play = unprojectAtZ(
      camera,
      0,
      ndcYFromImageFrac(FLOOR_PLAY_IMAGE_FRAC, camera),
      PLAY_Z,
    );
    const slope = (ledge.y - play.y) / (WALL_Z - PLAY_Z);
    const floorNormal = new THREE.Vector3(0, 1, -slope).normalize();
    const top = unprojectAtZ(camera, 0, 1, WALL_Z);
    const near = intersectRayWithFloor(camera, 0, -1, ledge.y, slope);
    near.z += FLOOR_CATCHER_NEAR_PAD;
    near.y = ledge.y + slope * (near.z - WALL_Z);

    const shadowMat = new THREE.ShadowMaterial({
      color: 0x5a3014,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wallMat = DEBUG_CATCHERS
      ? new THREE.MeshBasicMaterial({
          color: 0xff4da6,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      : shadowMat;
    const floorMat = DEBUG_CATCHERS
      ? new THREE.MeshBasicMaterial({
          color: 0x22e0ff,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      : shadowMat;
    const wall = this.makeWallCatcher(wallMat, ledge.y, top.y - ledge.y + WALL_CATCHER_TOP_PAD);
    const floor = this.makeFloorCatcher(floorMat, ledge, near, floorNormal);
    this.group.add(wall, floor);
    this.catchers.push(wall, floor);
    if (DEBUG_CATCHERS) {
      const seam = this.makeLedgeSeam(ledge);
      this.group.add(seam);
      this.catchers.push(seam);
    }
  }

  private makeWallCatcher(mat: THREE.Material, ledgeY: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CATCHER_WIDTH, height), mat);
    mesh.position.set(0, ledgeY + height * 0.5, WALL_Z);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.frustumCulled = false;
    mesh.name = "wall-shadow-catcher";
    return mesh;
  }

  private makeFloorCatcher(
    mat: THREE.Material,
    ledge: THREE.Vector3,
    near: THREE.Vector3,
    floorNormal: THREE.Vector3,
  ): THREE.Mesh {
    const depth = ledge.distanceTo(near);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CATCHER_WIDTH, depth), mat);
    mesh.quaternion.setFromUnitVectors(CATCHER_Z_AXIS, floorNormal);
    const towardCamera = CATCHER_Y_AXIS.clone().applyQuaternion(mesh.quaternion);
    if (towardCamera.z < 0) towardCamera.negate();
    mesh.position.copy(ledge).addScaledVector(towardCamera, depth * 0.5);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.frustumCulled = false;
    mesh.name = "floor-shadow-catcher";
    return mesh;
  }

  private makeLedgeSeam(ledge: THREE.Vector3): THREE.Line {
    const half = CATCHER_WIDTH * 0.5;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, ledge.y, ledge.z),
      new THREE.Vector3(half, ledge.y, ledge.z),
    ]);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false }),
    );
    line.frustumCulled = false;
    line.name = "catcher-ledge-seam";
    line.renderOrder = 10;
    return line;
  }

  private async loadBackdrop(camera: THREE.PerspectiveCamera): Promise<void> {
    const tex = await new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(BACKDROP_URL, resolve, undefined, reject);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      depthTest: true,
      depthWrite: true,
      toneMapped: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    mesh.name = "courtyard-backdrop";
    camera.add(mesh);
    this.backdrop = mesh;
    fitBackdrop(mesh, camera);
  }
}

function ndcYFromImageFrac(fracFromBottom: number, camera: THREE.PerspectiveCamera): number {
  const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * BACKDROP_DIST;
  const viewW = viewH * camera.aspect;
  let planeH = viewH;
  if (camera.aspect > BACKDROP_ASPECT) planeH = viewW / BACKDROP_ASPECT;
  return (2 * fracFromBottom - 1) * (planeH / viewH);
}

function unprojectAtZ(
  camera: THREE.PerspectiveCamera,
  ndcX: number,
  ndcY: number,
  planeZ: number,
): THREE.Vector3 {
  _ndc.set(ndcX, ndcY, 0.5).unproject(camera);
  const ox = camera.position.x;
  const oy = camera.position.y;
  const oz = camera.position.z;
  const t = (planeZ - oz) / (_ndc.z - oz);
  return new THREE.Vector3(ox + (_ndc.x - ox) * t, oy + (_ndc.y - oy) * t, planeZ);
}

function intersectRayWithFloor(
  camera: THREE.PerspectiveCamera,
  ndcX: number,
  ndcY: number,
  ledgeY: number,
  slope: number,
): THREE.Vector3 {
  _ndc.set(ndcX, ndcY, 0.5).unproject(camera);
  const ox = camera.position.x;
  const oy = camera.position.y;
  const oz = camera.position.z;
  const dx = _ndc.x - ox;
  const dy = _ndc.y - oy;
  const dz = _ndc.z - oz;
  // y = ledgeY + slope * (z - WALL_Z)
  // oy + t*dy = ledgeY + slope * (oz + t*dz - WALL_Z)
  const t = (ledgeY - oy + slope * (oz - WALL_Z)) / (dy - slope * dz);
  return new THREE.Vector3(ox + dx * t, oy + dy * t, oz + dz * t);
}

function fitBackdrop(mesh: THREE.Mesh, camera: THREE.PerspectiveCamera): void {
  const dist = BACKDROP_DIST;
  const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * dist;
  const viewW = viewH * camera.aspect;
  let planeW = viewW;
  let planeH = viewH;
  if (camera.aspect > BACKDROP_ASPECT) {
    planeH = viewW / BACKDROP_ASPECT;
  } else {
    planeW = viewH * BACKDROP_ASPECT;
  }
  mesh.scale.set(planeW, planeH, 1);
  mesh.position.set(0, 0, -dist);
}
