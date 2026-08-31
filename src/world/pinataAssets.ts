import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { PINATA_STENCIL_REF } from "./ropeAssets";

const BASE = "/pinata";

/** Target world height for the pinata mesh (before PINATA_SCALE). */
export const PINATA_UNIT_HEIGHT = 1.05;

/** Folder + file stem under `/pinata/types/{Folder}/T_Pinata_{Folder}_*`. */
export const PINATA_SKIN_PACKS = {
  gingerbread: "Gingerbread",
  gold: "Gold",
  wood: "Wood",
  angry: "Angry",
  carbonFiber: "CarbonFiber",
  circuit: "Circuit",
  electric: "Electric",
  fur: "Fur",
  galaxy: "Galaxy",
  ice: "Ice",
  normal: "Normal",
  lava: "Lava",
  rainbow: "Rainbow",
  rock: "Rock",
  jade: "Jade",
} as const;

export type PinataSkinId = keyof typeof PINATA_SKIN_PACKS;
export const DEFAULT_PINATA_SKIN: PinataSkinId = "normal";
export const PINATA_SKIN_IDS = Object.keys(PINATA_SKIN_PACKS) as PinataSkinId[];

export interface PinataTextureSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  ormMap: THREE.Texture;
  crackMap: THREE.Texture;
  crackMap2: THREE.Texture;
}

export interface PinataMeshAssets {
  template: THREE.Group;
  hitTemplate: THREE.Group;
  /** Local-space center of the mesh (hang point is 0; body hangs below). */
  hitCenterLocal: THREE.Vector3;
  /** World radius that roughly covers the mesh silhouette. */
  hitRadius: number;
  /** Local-space Z thickness of the idle mesh (before PINATA_SCALE). */
  bodyDepth: number;
  skins: Record<PinataSkinId, PinataTextureSet>;
}

let cache: PinataMeshAssets | null = null;
let loading: Promise<PinataMeshAssets> | null = null;

function skinUrls(id: PinataSkinId): { map: string; normal: string; orm: string } {
  const folder = PINATA_SKIN_PACKS[id];
  const stem = `${BASE}/types/${folder}/T_Pinata_${folder}`;
  return {
    map: `${stem}_BC.png`,
    normal: `${stem}_N.png`,
    orm: `${stem}_ORM.png`,
  };
}

function loadTexture(loader: THREE.TextureLoader, url: string, srgb: boolean): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        // This FBX UV set matches standard OpenGL / image-editor V (V=0 at bottom).
        tex.flipY = true;
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function preparePinataGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  // FBX comes non-indexed and without tangents; both hurt normal-map quality.
  let g = geo;
  if (!g.index) {
    const count = g.attributes.position!.count;
    const index = new Uint32Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    g.setIndex(new THREE.BufferAttribute(index, 1));
  }
  if (g.getAttribute("uv") && !g.getAttribute("uv2")) {
    g.setAttribute("uv2", g.getAttribute("uv")!.clone());
  }
  if (!g.getAttribute("tangent")) {
    try {
      g.computeTangents();
    } catch {
      // Derivative-based normals still work without tangents
    }
  }
  return g;
}

function prepareLoadedFbx(fbx: THREE.Object3D): void {
  fbx.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.geometry = preparePinataGeometry(mesh.geometry as THREE.BufferGeometry);
    mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  });
}

function measureWorldHeight(obj: THREE.Object3D): number {
  obj.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).y;
}

function normalizeFbxPair(idleFbx: THREE.Object3D, hitFbx: THREE.Object3D): {
  template: THREE.Group;
  hitTemplate: THREE.Group;
} {
  idleFbx.rotation.y = 0;
  hitFbx.rotation.y = 0;

  idleFbx.updateMatrixWorld(true);
  const s = PINATA_UNIT_HEIGHT / Math.max(measureWorldHeight(idleFbx), 1e-4);
  idleFbx.scale.setScalar(s);
  hitFbx.scale.setScalar(s);

  idleFbx.updateMatrixWorld(true);
  const idleBox = new THREE.Box3().setFromObject(idleFbx);
  const center = idleBox.getCenter(new THREE.Vector3());
  const dx = -center.x;
  const dz = -center.z;
  const dy = -idleBox.max.y;

  idleFbx.position.x += dx;
  idleFbx.position.z += dz;
  idleFbx.position.y += dy;
  hitFbx.position.x += dx;
  hitFbx.position.z += dz;
  hitFbx.position.y += dy;

  const template = new THREE.Group();
  template.name = "pinataRoot";
  template.add(idleFbx);

  const hitTemplate = new THREE.Group();
  hitTemplate.name = "pinataHitRoot";
  hitTemplate.add(hitFbx);

  return { template, hitTemplate };
}

export function createPinataMaterial(
  skin: PinataTextureSet,
  skinId: PinataSkinId = DEFAULT_PINATA_SKIN,
): THREE.MeshStandardMaterial {
  // ORM R=AO is usable. This export has G (roughness) ≈ 0 and elevated B (metalness),
  // which turns MeshStandardMaterial into dark chrome without an env map — skip those maps
  // and use ceramic defaults until a corrected ORM lands.
  const paper = skinId === "normal";
  const mat = new THREE.MeshStandardMaterial({
    map: skin.map,
    normalMap: skin.normalMap,
    normalScale: new THREE.Vector2(1, -1), // Unreal/DirectX → OpenGL
    aoMap: skin.ormMap,
    aoMapIntensity: paper ? 1 : 0.85,
    roughness: paper ? 0.78 : 0.62,
    metalness: 0.04,
    envMapIntensity: paper ? 0.28 : 0.55,
    stencilWrite: true,
    stencilRef: PINATA_STENCIL_REF,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCrackMap = { value: skin.crackMap };
    shader.uniforms.uCrackMap2 = { value: skin.crackMap2 };
    shader.uniforms.uCrackAmount = { value: (mat.userData.crackAmount as number) ?? 0 };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform sampler2D uCrackMap;
        uniform sampler2D uCrackMap2;
        uniform float uCrackAmount;
        `,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        #include <map_fragment>
        {
          float dmg = clamp(uCrackAmount, 0.0, 1.0);
          float a1 = clamp(dmg * 2.0, 0.0, 1.0);
          float a2 = clamp(dmg * 2.0 - 1.0, 0.0, 1.0);
          float crack = texture2D(uCrackMap, vMapUv).r * a1;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0), crack);
          crack = texture2D(uCrackMap2, vMapUv).r * a2;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0), crack);
        }
        `,
      );
    mat.userData.shader = shader;
  };
  mat.customProgramCacheKey = () => "pinata-cracks-v7";
  mat.userData.crackAmount = 0;

  return mat;
}

export function setCrackAmount(mat: THREE.MeshStandardMaterial, amount: number): void {
  mat.userData.crackAmount = amount;
  const shader = mat.userData.shader as { uniforms: { uCrackAmount: { value: number } } } | undefined;
  if (shader) shader.uniforms.uCrackAmount.value = amount;
}

/** Missing HP fraction. 1 at one hit from death so mask 2 is fully visible before the break. */
export function crackAmountFromHp(hp: number, maxHp: number, lastHitDamage = 1): number {
  const floor = Math.min(Math.max(0, maxHp - 1), Math.max(1, lastHitDamage));
  if (maxHp <= floor) return hp > 0 ? 0 : 1;
  return Math.min(1, Math.max(0, 1 - (Math.max(0, hp) - floor) / (maxHp - floor)));
}

export async function loadPinataAssets(renderer?: THREE.WebGLRenderer): Promise<PinataMeshAssets> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    const texLoader = new THREE.TextureLoader();
    const fbxLoader = new FBXLoader();

    const [fbx, hitFbx, skinPacks, crackMap, crackMap2] = await Promise.all([
      fbxLoader.loadAsync(`${BASE}/SM_Pinata_01.fbx`),
      fbxLoader.loadAsync(`${BASE}/SM_Pinata_01_Hit.fbx`),
      Promise.all(
        PINATA_SKIN_IDS.map(async (id) => {
          const urls = skinUrls(id);
          const [map, normalMap, ormMap] = await Promise.all([
            loadTexture(texLoader, urls.map, true),
            loadTexture(texLoader, urls.normal, false),
            loadTexture(texLoader, urls.orm, false),
          ]);
          return [id, { map, normalMap, ormMap }] as const;
        }),
      ),
      loadTexture(texLoader, `${BASE}/T_Crack_Mask.jpg`, false),
      loadTexture(texLoader, `${BASE}/T_Crack_Mask2.jpg`, false),
    ]);

    const skins = {} as Record<PinataSkinId, PinataTextureSet>;
    const allMaps: THREE.Texture[] = [crackMap, crackMap2];
    for (const [id, pack] of skinPacks) {
      skins[id] = { ...pack, crackMap, crackMap2 };
      allMaps.push(pack.map, pack.normalMap, pack.ormMap);
    }

    if (renderer) {
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      for (const t of allMaps) {
        t.anisotropy = Math.min(16, maxAniso);
      }
    }

    prepareLoadedFbx(fbx);
    prepareLoadedFbx(hitFbx);

    const { template, hitTemplate } = normalizeFbxPair(fbx, hitFbx);
    template.updateMatrixWorld(true);
    const hitBox = new THREE.Box3().setFromObject(template);
    const hitCenterLocal = hitBox.getCenter(new THREE.Vector3());
    const hitSize = hitBox.getSize(new THREE.Vector3());
    const hitRadius = Math.max(hitSize.x, hitSize.y) * 0.42 * 1.1;
    const bodyDepth = hitSize.z;

    cache = { template, hitTemplate, hitCenterLocal, hitRadius, bodyDepth, skins };
    return cache;
  })();

  try {
    return await loading;
  } catch (err) {
    loading = null;
    throw err;
  }
}
