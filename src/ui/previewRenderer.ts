import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * One extra WebGL context for HUD previews (unlock chip, shop stick).
 * Three.js r172 dispose() does not call loseContext(), so creating a new
 * renderer every round-end leaves the old GPU context alive. Chrome then
 * evicts the oldest context — the game canvas — and the playfield goes white.
 */
let renderer: THREE.WebGLRenderer | null = null;
let envMap: THREE.Texture | null = null;
let users = 0;

export function acquirePreviewRenderer(): {
  renderer: THREE.WebGLRenderer;
  envMap: THREE.Texture;
} {
  if (!renderer) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const pmrem = new THREE.PMREMGenerator(renderer);
    envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  users += 1;
  return { renderer, envMap: envMap! };
}

export function attachPreviewCanvas(host: HTMLElement): void {
  if (!renderer) return;
  const canvas = renderer.domElement;
  if (canvas.parentElement !== host) host.appendChild(canvas);
}

export function releasePreviewRenderer(): void {
  users = Math.max(0, users - 1);
  if (users > 0 || !renderer) return;
  renderer.domElement.remove();
}
