import * as THREE from "three";
import { createStickMaterial, loadStickAssets, setStickHue } from "../world/stickAssets";
import { acquirePreviewRenderer, attachPreviewCanvas, releasePreviewRenderer } from "./previewRenderer";

const SPIN_RAD_PER_SEC = 0.7;

/** Isolated spinning stick for the shop preview. */
export class StickPreview {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private spin: THREE.Group | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private raf = 0;
  private lastTime = 0;
  private disposed = false;
  private ownsRenderer = false;

  async mount(host: HTMLElement, hue: number): Promise<void> {
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
    const key = new THREE.DirectionalLight(0xffe6b5, 1.2);
    key.position.set(2.2, 3.4, 3.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb8d4ff, 0.55);
    rim.position.set(-2.4, 1.2, -2.6);
    scene.add(rim);

    const assets = await loadStickAssets(renderer);
    if (this.disposed) return;

    const visual = assets.template.clone(true);
    const material = createStickMaterial(assets, hue);
    this.material = material;
    visual.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = material;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    visual.rotation.z = -0.38;
    visual.rotation.x = 0.18;

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
    const size = framed.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.08, 20);
    const dist = ((maxDim * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.18;
    camera.position.set(dist * 0.28, dist * 0.08, dist);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    this.syncSize(host);
    requestAnimationFrame(() => this.syncSize(host));
    renderer.compile(scene, camera);
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  setHue(hue: number): void {
    if (this.material) setStickHue(this.material, hue);
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
    const cssW = Math.max(1, host.clientWidth || 160);
    const cssH = Math.max(1, host.clientHeight || 160);
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
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };
}
