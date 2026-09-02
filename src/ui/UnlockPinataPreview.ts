import * as THREE from "three";
import { PINATA_TYPES, type PinataTypeId } from "../game/pinataTypes";
import {
  loadPinataAssets,
  type PinataSkinId,
  type PinataTextureSet,
} from "../world/pinataAssets";
import { acquirePreviewRenderer, attachPreviewCanvas, releasePreviewRenderer } from "./previewRenderer";

export function skinForUnlockType(typeId: string | undefined): PinataSkinId {
  if (typeId && typeId in PINATA_TYPES) {
    return PINATA_TYPES[typeId as PinataTypeId].skin ?? "normal";
  }
  return "normal";
}

const FILL_DURATION = 0.55;
const SPIN_RAD_PER_SEC = 0.85;

type FillShader = {
  uniforms: {
    uFill: { value: number };
    uMinY: { value: number };
    uMaxY: { value: number };
  };
};

function createFillMaterial(skin: PinataTextureSet, skinId: PinataSkinId): THREE.MeshStandardMaterial {
  const paper = skinId === "normal";
  const mat = new THREE.MeshStandardMaterial({
    map: skin.map,
    normalMap: skin.normalMap,
    normalScale: new THREE.Vector2(1, -1),
    aoMap: skin.ormMap,
    aoMapIntensity: paper ? 1 : 0.85,
    roughness: paper ? 0.78 : 0.62,
    metalness: 0.04,
    envMapIntensity: paper ? 0.28 : 0.55,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFill = { value: 0 };
    shader.uniforms.uMinY = { value: -1 };
    shader.uniforms.uMaxY = { value: 1 };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        varying float vUnlockY;
        `,
      )
      .replace(
        "#include <project_vertex>",
        /* glsl */ `
        #include <project_vertex>
        vUnlockY = (modelMatrix * vec4(transformed, 1.0)).y;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uFill;
        uniform float uMinY;
        uniform float uMaxY;
        varying float vUnlockY;
        `,
      )
      .replace(
        "#include <opaque_fragment>",
        /* glsl */ `
        {
          float fill = clamp(uFill, 0.0, 1.0);
          float edge = mix(uMinY, uMaxY, fill);
          float span = max(1e-4, uMaxY - uMinY);
          float feather = span * 0.022;
          // Color occupies everything below the rising fill line.
          float reveal = 1.0 - smoothstep(edge, edge + feather, vUnlockY);
          float ndv = max(dot(normalize(normal), normalize(vViewPosition)), 0.0);
          float rim = pow(1.0 - ndv, 3.0);
          float shape = dot(outgoingLight, vec3(0.22, 0.71, 0.07));
          vec3 locked = vec3(shape * 0.035 + rim * 0.16);
          outgoingLight = mix(locked, outgoingLight, reveal);
        }
        #include <opaque_fragment>
        `,
      );

    mat.userData.shader = shader as unknown as FillShader;
  };
  mat.customProgramCacheKey = () => "pinata-unlock-preview-v1";

  return mat;
}

function setFillUniforms(
  mat: THREE.MeshStandardMaterial,
  fill: number,
  minY: number,
  maxY: number,
): void {
  const shader = mat.userData.shader as FillShader | undefined;
  if (!shader) return;
  shader.uniforms.uFill.value = fill;
  shader.uniforms.uMinY.value = minY;
  shader.uniforms.uMaxY.value = maxY;
}

export interface UnlockPinataPreviewOpts {
  skin: PinataSkinId;
  fill: number;
}

/** Isolated spinning pinata for the round-end unlock chip. */
export class UnlockPinataPreview {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private spin: THREE.Group | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private raf = 0;
  private lastTime = 0;
  private fillFrom = 0;
  private fillTo = 0;
  private fillElapsed = 0;
  private fillMinY = -1;
  private fillMaxY = 1;
  private disposed = false;
  private ownsRenderer = false;

  async mount(host: HTMLElement, opts: UnlockPinataPreviewOpts): Promise<void> {
    this.dispose();
    this.disposed = false;

    const { renderer, envMap } = acquirePreviewRenderer();
    this.ownsRenderer = true;
    this.renderer = renderer;
    attachPreviewCanvas(host);

    const scene = new THREE.Scene();
    this.scene = scene;
    scene.environment = envMap;

    scene.add(new THREE.HemisphereLight(0xfff0dd, 0x2a2030, 0.55));
    const key = new THREE.DirectionalLight(0xffe6b5, 1.15);
    key.position.set(2.2, 3.4, 3.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb8d4ff, 0.55);
    rim.position.set(-2.4, 1.2, -2.6);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffc4e0, 0.28);
    fill.position.set(-1.6, -0.4, 2.2);
    scene.add(fill);

    const assets = await loadPinataAssets(renderer);
    if (this.disposed) return;

    const visual = assets.template.clone(true);
    const material = createFillMaterial(assets.skins[opts.skin], opts.skin);
    this.material = material;
    visual.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = material;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    visual.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(visual);
    const center = box.getCenter(new THREE.Vector3());
    visual.position.sub(center);

    const spin = new THREE.Group();
    spin.add(visual);
    scene.add(spin);
    this.spin = spin;

    spin.updateMatrixWorld(true);
    const framed = new THREE.Box3().setFromObject(spin);
    this.fillMinY = framed.min.y - 0.012;
    this.fillMaxY = framed.max.y + 0.012;

    const size = framed.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.08, 20);
    const dist = ((maxDim * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.08;
    camera.position.set(dist * 0.32, dist * 0.04, dist);
    camera.lookAt(0, -maxDim * 0.02, 0);
    this.camera = camera;

    this.fillFrom = 0;
    this.fillTo = THREE.MathUtils.clamp(opts.fill, 0, 1);
    this.fillElapsed = 0;
    this.syncSize(host);
    renderer.compile(scene, camera);
    setFillUniforms(material, 0, this.fillMinY, this.fillMaxY);
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.spin?.removeFromParent();
    this.spin = null;
    this.scene = null;
    this.camera = null;
    this.material?.dispose();
    this.material = null;
    if (this.ownsRenderer) {
      releasePreviewRenderer();
      this.ownsRenderer = false;
    }
    this.renderer = null;
  }

  private syncSize(host: HTMLElement): void {
    if (!this.renderer || !this.camera) return;
    const cssW = Math.max(1, host.clientWidth || 72);
    const cssH = Math.max(1, host.clientHeight || 86);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssW, cssH, false);
    this.camera.aspect = cssW / cssH;
    this.camera.updateProjectionMatrix();
  }

  private tick = (now: number): void => {
    if (this.disposed || !this.renderer || !this.scene || !this.camera || !this.spin) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.spin.rotation.y += dt * SPIN_RAD_PER_SEC;

    this.fillElapsed += dt;
    const t = Math.min(1, this.fillElapsed / FILL_DURATION);
    const eased = 1 - (1 - t) ** 3;
    const fill = this.fillFrom + (this.fillTo - this.fillFrom) * eased;
    if (this.material) setFillUniforms(this.material, fill, this.fillMinY, this.fillMaxY);

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };
}
