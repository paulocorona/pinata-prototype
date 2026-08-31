import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { assetUrl } from "../util/assetUrl";

const BASE = assetUrl("rope");

/**
 * World-space radius. Matches the old cylinder so the new mesh keeps the same
 * on-screen weight.
 */
export const ROPE_RADIUS = 0.03;
/** Courtyard beam Y the hanging ropes reach toward. */
export const ROPE_BEAM_Y = 9.06;
/**
 * Stencil value written by pinata bodies. Ropes fail the stencil test on these
 * pixels so a nearer rope never draws across a farther pinata.
 */
export const PINATA_STENCIL_REF = 1;
/** After pinata bodies (renderOrder 0) so the stencil mask is complete. */
export const ROPE_RENDER_ORDER = 1;
/** Enough copies for the longest hang (warmup drop included). */
const MAX_ROPE_TILES = 8;

export interface RopeMeshAssets {
  geometry: THREE.BufferGeometry;
  tileHeight: number;
  map: THREE.Texture;
  normalMap: THREE.Texture;
  ormMap: THREE.Texture;
  material: THREE.MeshStandardMaterial;
}

let cache: RopeMeshAssets | null = null;
let loading: Promise<RopeMeshAssets> | null = null;

function loadTexture(loader: THREE.TextureLoader, url: string, srgb: boolean): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        // This FBX UV set matches standard OpenGL / image-editor V (V=0 at bottom).
        tex.flipY = true;
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function prepareRopeGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo;
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
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** Radius-fit tile, modeled proportions, origin at the bottom center. */
function bakeTileGeometry(mesh: THREE.Mesh): { geometry: THREE.BufferGeometry; tileHeight: number } {
  mesh.updateMatrixWorld(true);
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const nativeRadius = Math.max(size.x, size.z) * 0.5;
  const center = box.getCenter(new THREE.Vector3());
  const s = ROPE_RADIUS / Math.max(nativeRadius, 1e-4);

  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));
  geo.applyMatrix4(new THREE.Matrix4().makeScale(s, s, s));
  prepareRopeGeometry(geo);
  return { geometry: geo, tileHeight: size.y * s };
}

export function createRopeMaterial(assets: Omit<RopeMeshAssets, "geometry" | "material" | "tileHeight">): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: assets.map,
    normalMap: assets.normalMap,
    normalScale: new THREE.Vector2(1, -1), // Unreal/DirectX → OpenGL
    aoMap: assets.ormMap,
    aoMapIntensity: 0.85,
    roughnessMap: assets.ormMap,
    roughness: 1,
    metalness: 0.04,
    envMapIntensity: 0.55,
    // Extra tile above the beam is clipped so copies never need Y-scale.
    clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, -1, 0), ROPE_BEAM_Y)],
    clipShadows: true,
    // Three.js only enables the stencil *test* when stencilWrite is true.
    // Write mask 0 keeps the pinata mask intact.
    stencilWrite: true,
    stencilWriteMask: 0,
    stencilRef: PINATA_STENCIL_REF,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });
}

export function createRope(assets: RopeMeshAssets): THREE.Group {
  const root = new THREE.Group();
  root.name = "ropeRoot";
  root.userData.tileHeight = assets.tileHeight;
  for (let i = 0; i < MAX_ROPE_TILES; i++) {
    const mesh = new THREE.Mesh(assets.geometry, assets.material);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.renderOrder = ROPE_RENDER_ORDER;
    mesh.visible = false;
    root.add(mesh);
  }
  setRopeLength(root, assets.tileHeight);
  return root;
}

/** Stack rest-sized tiles from the hang join up; overflow is clipped at the beam. */
export function setRopeLength(root: THREE.Group, length: number): void {
  const tile = (root.userData.tileHeight as number) || 1;
  const len = Math.max(0.4, length);
  const n = Math.min(root.children.length, Math.max(1, Math.ceil(len / tile)));

  for (let i = 0; i < root.children.length; i++) {
    const mesh = root.children[i];
    if (i >= n) {
      mesh.visible = false;
      continue;
    }
    mesh.visible = true;
    mesh.position.set(0, i * tile, 0);
    mesh.scale.set(1, 1, 1);
  }
}

export function disposeRope(root: THREE.Group): void {
  root.clear();
}

export async function loadRopeAssets(renderer?: THREE.WebGLRenderer): Promise<RopeMeshAssets> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    const texLoader = new THREE.TextureLoader();
    const fbxLoader = new FBXLoader();

    const [map, normalMap, ormMap, fbx] = await Promise.all([
      loadTexture(texLoader, `${BASE}/T_Rope_BC.png`, true),
      loadTexture(texLoader, `${BASE}/T_Rope_N.png`, false),
      loadTexture(texLoader, `${BASE}/T_Rope_ORM.png`, false),
      fbxLoader.loadAsync(`${BASE}/SM_Rope.fbx`),
    ]);

    if (renderer) {
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      for (const t of [map, normalMap, ormMap]) {
        t.anisotropy = Math.min(8, maxAniso);
      }
    }

    fbx.updateMatrixWorld(true);
    let source: THREE.Mesh | null = null;
    fbx.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !source) source = mesh;
    });
    if (!source) {
      throw new Error("SM_Rope.fbx has no mesh");
    }

    const { geometry, tileHeight } = bakeTileGeometry(source);
    const material = createRopeMaterial({ map, normalMap, ormMap });
    cache = { geometry, tileHeight, map, normalMap, ormMap, material };
    return cache;
  })();

  try {
    return await loading;
  } catch (err) {
    loading = null;
    throw err;
  }
}
