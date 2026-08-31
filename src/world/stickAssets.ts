import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const BASE = "/stick";

/** Target world length. */
export const STICK_UNIT_HEIGHT = 1.44;

export interface StickMeshAssets {
  template: THREE.Group;
  map: THREE.Texture;
  normalMap: THREE.Texture;
  ormMap: THREE.Texture;
}

let cache: StickMeshAssets | null = null;
let loading: Promise<StickMeshAssets> | null = null;

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
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function prepareStickGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  // FBX comes non-indexed and without tangents; both hurt normal-map quality.
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
  return g;
}

function prepareLoadedFbx(fbx: THREE.Object3D): void {
  fbx.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.geometry = prepareStickGeometry(mesh.geometry as THREE.BufferGeometry);
    mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  });
}

function measureWorldHeight(obj: THREE.Object3D): number {
  obj.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).y;
}

function normalizeStickFbx(fbx: THREE.Object3D): THREE.Group {
  fbx.rotation.y = 0;
  fbx.updateMatrixWorld(true);
  const s = STICK_UNIT_HEIGHT / Math.max(measureWorldHeight(fbx), 1e-4);
  fbx.scale.setScalar(s);

  fbx.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fbx);
  const center = box.getCenter(new THREE.Vector3());
  fbx.position.x += -center.x;
  fbx.position.z += -center.z;
  fbx.position.y += -box.min.y;

  const template = new THREE.Group();
  template.name = "stickRoot";
  template.add(fbx);
  return template;
}

export function setStickHue(mat: THREE.MeshStandardMaterial, hue: number): void {
  mat.userData.hueShift = hue;
  const shader = mat.userData.shader as { uniforms: { uHueShift: { value: number } } } | undefined;
  if (shader) shader.uniforms.uHueShift.value = hue;
}

export function createStickMaterial(assets: StickMeshAssets, hueShift = 0): THREE.MeshStandardMaterial {
  // Same Unreal-pack tweaks as the pinata: DirectX normal, AO from ORM R.
  // This export's G (roughness) is a healthy ~0.72 and B (metalness) is 0, so
  // roughnessMap is safe — still skip metalnessMap and keep paint-like metalness.
  const mat = new THREE.MeshStandardMaterial({
    map: assets.map,
    normalMap: assets.normalMap,
    normalScale: new THREE.Vector2(1, -1), // Unreal/DirectX → OpenGL
    aoMap: assets.ormMap,
    aoMapIntensity: 0.85,
    roughnessMap: assets.ormMap,
    roughness: 1,
    metalness: 0.04,
    envMapIntensity: 0.55,
  });
  mat.userData.hueShift = hueShift;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHueShift = { value: mat.userData.hueShift ?? 0 };
    mat.userData.shader = shader;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uHueShift;
        vec3 hueRotateRgb(vec3 color, float hue) {
          float angle = hue * 6.28318530718;
          float s = sin(angle);
          float c = cos(angle);
          vec3 k = vec3(0.57735026919);
          return color * c + cross(k, color) * s + k * dot(k, color) * (1.0 - c);
        }
        `,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        #include <map_fragment>
        diffuseColor.rgb = hueRotateRgb(diffuseColor.rgb, uHueShift);
        `,
      );
  };
  mat.customProgramCacheKey = () => "stick-hue-v1";
  return mat;
}

export async function loadStickAssets(renderer?: THREE.WebGLRenderer): Promise<StickMeshAssets> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    const texLoader = new THREE.TextureLoader();
    const fbxLoader = new FBXLoader();

    const [map, normalMap, ormMap, fbx] = await Promise.all([
      loadTexture(texLoader, `${BASE}/T_Stick_BC.png`, true),
      loadTexture(texLoader, `${BASE}/T_Stick_N.png`, false),
      loadTexture(texLoader, `${BASE}/T_Stick_ORM.png`, false),
      fbxLoader.loadAsync(`${BASE}/SM_Stick.fbx`),
    ]);

    if (renderer) {
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      for (const t of [map, normalMap, ormMap]) {
        t.anisotropy = Math.min(8, maxAniso);
      }
    }

    prepareLoadedFbx(fbx);
    const template = normalizeStickFbx(fbx);

    cache = { template, map, normalMap, ormMap };
    return cache;
  })();

  try {
    return await loading;
  } catch (err) {
    loading = null;
    throw err;
  }
}
