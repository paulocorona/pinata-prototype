import * as THREE from "three";
import { rng } from "../util/rng";
import type { LootBand, PinataTypeDef } from "../game/pinataTypes";
import { BASIC_PINATA } from "../game/pinataTypes";
import {
  crackAmountFromHp,
  createPinataMaterial,
  DEFAULT_PINATA_SKIN,
  loadPinataAssets,
  setCrackAmount,
  type PinataMeshAssets,
} from "./pinataAssets";
import {
  createRope,
  disposeRope,
  loadRopeAssets,
  ROPE_BEAM_Y,
  setRopeLength,
  type RopeMeshAssets,
} from "./ropeAssets";

/** Visual + gameplay size relative to the unit-normalized pinata mesh */
export const PINATA_SCALE = 1.092 * 0.7;
/** World-space mesh thickness along Z; set after PinataFactory.load(). */
export let PINATA_DEPTH_WORLD = 0.7 * PINATA_SCALE;
/** How far the rope bottom embeds into the mesh (world units, after scale). */
export const ROPE_EMBED = 0.32;
/** Seconds to show the hit-pose mesh after a connecting swing. */
export const HIT_MESH_DURATION = 0.2;
/** Fallback; real radius comes from the loaded mesh bounds. */
export let PINATA_HIT_RADIUS_WORLD = 0.55 * 1.1 * PINATA_SCALE;

export interface PinataEntity {
  id: number;
  group: THREE.Group;
  /** Pivot at the rope/pinata join — swing rotates around this origin. */
  body: THREE.Object3D;
  hitAnchor: THREE.Object3D;
  /** Unscaled offset from mesh center to the rope join (body origin). */
  hangOffset: THREE.Vector3;
  hangOffsetY: number;
  /** Extra Z rotation so a star point faces up. */
  hangBaseRotZ: number;
  rope: THREE.Group;
  hp: number;
  maxHp: number;
  alive: boolean;
  home: THREE.Vector3;
  phase: number;
  speedMul: number;
  motionStyle: 0 | 1 | 2;
  screen: THREE.Vector3;
  hitRadiusWorld: number;
  /** Half the XY silhouette (world), for overlap that matches the visible mesh. */
  bodyRadiusXY: number;
  /** Mesh thickness along Z (world). */
  bodyDepthWorld: number;
  squash: number;
  /** Extra Y above rest while dropping in; 0 when settled. */
  dropY: number;
  dropVelY: number;
  damageFlash: number;
  /** Elapsed time in the low-HP red pulse; 0 when above the threshold. */
  lowHpFlashT: number;
  /** Pendulum angle (rad) and velocity after a hit. */
  swing: number;
  swingVel: number;
  /** Remaining time to show the hit-pose mesh. */
  hitMeshTimer: number;
  idleVisual: THREE.Object3D;
  hitVisual: THREE.Object3D;
  loot: LootBand[];
  typeId: string;
  bodyMat: THREE.MeshStandardMaterial;
  glowing: boolean;
  /** Player-stick hits landed this life (swing / double). Used by First Hit Damage. */
  playerHits: number;
  /** Remaining Ignite duration; 0 when not on fire. */
  burnRemaining: number;
  /** Countdown to the next Ignite tick. */
  burnTickTimer: number;
  /** Spawned with Extra Loot (+25% candy on break). */
  extraLoot: boolean;
  /** Floor candy grabbed this life (thief types; wired later). */
  grabbedCandy: number;
  /** Seconds spent roaming toward a full bag. */
  fillTimer: number;
  /** True after fillDurationSec — smash pays 1.5× grabbed candy. */
  thiefFull: boolean;
}

let nextId = 1;

const _hitWorld = new THREE.Vector3();

/** World-space center used for targeting / VFX. */
export function getPinataHitWorld(p: PinataEntity, out = _hitWorld): THREE.Vector3 {
  return p.hitAnchor.getWorldPosition(out);
}

/** Flash red at or below this remaining HP fraction. */
export const LOW_HP_FLASH_THRESHOLD = 0.3;
/** Seconds for one full low-HP sine cycle (50% faster than a 2s wave). */
export const LOW_HP_FLASH_PERIOD = 2 / 1.5;
/** Peak sine mix into the red warning tint. */
const LOW_HP_FLASH_PEAK = 0.92;

export function applyHitTint(mat: THREE.MeshStandardMaterial, strength: number, glowing = false): void {
  const t = THREE.MathUtils.clamp(strength, 0, 1);
  if (t <= 0) {
    if (glowing) {
      mat.emissive.setHex(0xffd166);
      mat.emissiveIntensity = 0.55;
      mat.color.setHex(0xffffff);
      return;
    }
    mat.emissive.setHex(0x000000);
    mat.emissiveIntensity = 0;
    mat.color.setHex(0xffffff);
    return;
  }
  if (glowing) {
    mat.emissive.setRGB(1, 0.55 + 0.3 * (1 - t), 0.12 + 0.28 * (1 - t));
    mat.emissiveIntensity = 0.7 + 0.35 * t;
    mat.color.setRGB(1, 1 - 0.2 * t, 1 - 0.28 * t);
    return;
  }
  mat.emissive.setHex(0xff2414);
  mat.emissiveIntensity = 0.55 + 0.4 * t;
  mat.color.setRGB(1, 1 - 0.42 * t, 1 - 0.48 * t);
}

export function applyBurnTint(p: PinataEntity): void {
  const pulse = 0.5 + 0.5 * Math.sin(p.phase * 14);
  p.bodyMat.emissive.setRGB(1, 0.22 + 0.28 * pulse, 0.04);
  p.bodyMat.emissiveIntensity = 0.7 + 0.55 * pulse;
  p.bodyMat.color.setRGB(1, 0.72 + 0.18 * (1 - pulse), 0.42);
}

export function applyGlowIdle(p: PinataEntity): void {
  if (!p.glowing) return;
  const pulse = 0.5 + 0.28 * Math.sin(p.phase * 5);
  p.bodyMat.emissive.setHex(0xffd166);
  p.bodyMat.emissiveIntensity = 0.42 + pulse;
}

/** 0–1 sine, one cycle every LOW_HP_FLASH_PERIOD seconds. */
export function lowHpFlashStrength(elapsed: number): number {
  const wave = 0.5 + 0.5 * Math.sin((elapsed / LOW_HP_FLASH_PERIOD) * Math.PI * 2);
  return wave * LOW_HP_FLASH_PEAK;
}

export function applyLowHpSineTint(
  mat: THREE.MeshStandardMaterial,
  strength: number,
  glowing = false,
): void {
  const t = THREE.MathUtils.clamp(strength, 0, 1);
  if (glowing) {
    mat.emissive.setRGB(1, 0.82 * (1 - t) + 0.14 * t, 0.4 * (1 - t));
    mat.emissiveIntensity = 0.42 + 0.7 * t;
    mat.color.setRGB(1, 1 - 0.38 * t, 1 - 0.46 * t);
    return;
  }
  mat.emissive.setHex(0xff2414);
  mat.emissiveIntensity = t * 0.95;
  mat.color.setRGB(1, 1 - 0.52 * t, 1 - 0.6 * t);
}

export function applyLowHpOrIdleTint(p: PinataEntity): void {
  const lowHp = p.maxHp > 0 && p.hp / p.maxHp <= LOW_HP_FLASH_THRESHOLD;
  if (lowHp) {
    applyLowHpSineTint(p.bodyMat, lowHpFlashStrength(p.lowHpFlashT), p.glowing);
    return;
  }
  if (p.glowing) applyGlowIdle(p);
  else applyHitTint(p.bodyMat, 0, false);
}

export class PinataFactory {
  private assets: PinataMeshAssets | null = null;
  private ropeAssets: RopeMeshAssets | null = null;

  async load(renderer?: THREE.WebGLRenderer): Promise<void> {
    const [pinata, rope] = await Promise.all([
      loadPinataAssets(renderer),
      loadRopeAssets(renderer),
    ]);
    this.assets = pinata;
    this.ropeAssets = rope;
    PINATA_HIT_RADIUS_WORLD = this.assets.hitRadius * PINATA_SCALE;
    PINATA_DEPTH_WORLD = this.assets.bodyDepth * PINATA_SCALE;
  }

  get ready(): boolean {
    return this.assets != null && this.ropeAssets != null;
  }

  create(
    home: THREE.Vector3,
    type: PinataTypeDef = BASIC_PINATA,
    motionStyle: 0 | 1 | 2,
    speedMul: number,
    glowing = false,
  ): PinataEntity {
    if (!this.assets || !this.ropeAssets) {
      throw new Error("PinataFactory.load() must finish before create()");
    }

    const visual = this.assets.template.clone(true);
    const hitVisual = this.assets.hitTemplate.clone(true);
    visual.updateMatrixWorld(true);

    const skinId = type.skin ?? DEFAULT_PINATA_SKIN;
    const skin = this.assets.skins[skinId];
    const bodyMat = createPinataMaterial(skin, skinId);
    const applyMat = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = bodyMat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
    };
    applyMat(visual);
    applyMat(hitVisual);

    // Pivot / aim at the true mesh center so the hit volume matches the visible body.
    const bounds = new THREE.Box3().setFromObject(visual);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    // Cover the longer silhouette axis with a little forgiveness, then +10%.
    const hitRadius = Math.max(size.x, size.y) * 0.42 * 1.1 * PINATA_SCALE;
    const bodyRadiusXY = Math.max(size.x, size.y) * 0.5 * PINATA_SCALE;
    const bodyDepthWorld = size.z * PINATA_SCALE;

    // Body origin is the rope/pinata join so hits pendulum around that point.
    const hangOffset = new THREE.Vector3(0, bounds.max.y - center.y - ROPE_EMBED / PINATA_SCALE, 0);
    const body = new THREE.Group();
    visual.position.set(-center.x - hangOffset.x, -center.y - hangOffset.y, -center.z - hangOffset.z);
    hitVisual.position.set(-center.x - hangOffset.x, -center.y - hangOffset.y, -center.z - hangOffset.z);
    hitVisual.visible = false;
    body.add(visual);
    body.add(hitVisual);
    const hangBaseRotZ = 0;
    body.rotation.z = 0;
    body.scale.setScalar(PINATA_SCALE);
    body.position.set(hangOffset.x * PINATA_SCALE, hangOffset.y * PINATA_SCALE, hangOffset.z * PINATA_SCALE);

    const group = new THREE.Group();
    group.position.copy(home);
    group.add(body);

    const hitAnchor = new THREE.Object3D();
    hitAnchor.position.set(-hangOffset.x, -hangOffset.y, -hangOffset.z);
    body.add(hitAnchor);

    const rope = createRope(this.ropeAssets);
    rope.position.copy(body.position);
    setRopeLength(rope, Math.max(0.4, ROPE_BEAM_Y - (home.y + body.position.y)));
    group.add(rope);

    if (glowing) {
      // Emissive-only: a PointLight per glowing piñata blows the courtyard out
      // to white once More Pinatas + Glowing Spread stack.
      bodyMat.emissive.setHex(0xffd166);
      bodyMat.emissiveIntensity = 0.6;
    }

    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("hitdebug")) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(hitRadius, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          wireframe: true,
          depthTest: false,
          transparent: true,
          opacity: 0.85,
        }),
      );
      marker.renderOrder = 10;
      hitAnchor.add(marker);
    }

    return {
      id: nextId++,
      group,
      body,
      hitAnchor,
      hangOffset,
      hangOffsetY: hangOffset.y,
      hangBaseRotZ,
      rope,
      hp: type.hp,
      maxHp: type.hp,
      alive: true,
      home: home.clone(),
      phase: rng.range(0, Math.PI * 2),
      speedMul,
      motionStyle,
      screen: new THREE.Vector3(),
      hitRadiusWorld: hitRadius,
      bodyRadiusXY,
      bodyDepthWorld,
      squash: 0,
      dropY: 0,
      dropVelY: 0,
      damageFlash: 0,
      lowHpFlashT: 0,
      swing: 0,
      swingVel: 0,
      hitMeshTimer: 0,
      idleVisual: visual,
      hitVisual,
      loot: type.loot,
      typeId: type.id,
      bodyMat,
      glowing,
      playerHits: 0,
      burnRemaining: 0,
      burnTickTimer: 0,
      extraLoot: false,
      grabbedCandy: 0,
      fillTimer: 0,
      thiefFull: false,
    };
  }

  applyDamageVisual(p: PinataEntity, hitDamage = 1): void {
    setCrackAmount(p.bodyMat, crackAmountFromHp(p.hp, p.maxHp, hitDamage));
    p.hitMeshTimer = HIT_MESH_DURATION;
    p.idleVisual.visible = false;
    p.hitVisual.visible = true;
    applyHitTint(p.bodyMat, 1, p.glowing);
  }

  /** Turn a living piñata glowing (Glowing Spread). */
  applyGlow(p: PinataEntity): void {
    if (p.glowing) return;
    p.glowing = true;
    p.bodyMat.emissive.setHex(0xffd166);
    p.bodyMat.emissiveIntensity = 0.6;
  }

  dispose(p: PinataEntity): void {
    p.group.parent?.remove(p.group);
    p.bodyMat.dispose();
    disposeRope(p.rope);
  }
}
