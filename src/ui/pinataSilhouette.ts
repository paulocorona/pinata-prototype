import { pinataPortraitSrc } from "../game/pinataTypes";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

/** Max canvas edge so HUD silhouettes stay cheap. */
const SILHOUETTE_MAX = 192;
/** Flood-fill treats near-black edge pixels as the portrait backdrop. */
const BG_LUMA = 22;

/**
 * Black filled silhouette of a portrait (transparent backdrop).
 * Portraits sit on black, including interior face black, so we flood-fill
 * from the edges instead of thresholding the whole image.
 */
export function pinataSilhouetteSrc(typeId: string): Promise<string> {
  const cached = cache.get(typeId);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(typeId);
  if (pending) return pending;
  const next = buildSilhouette(typeId)
    .then((url) => {
      cache.set(typeId, url);
      inflight.delete(typeId);
      return url;
    })
    .catch(() => {
      inflight.delete(typeId);
      return pinataPortraitSrc(typeId);
    });
  inflight.set(typeId, next);
  return next;
}

async function buildSilhouette(typeId: string): Promise<string> {
  const img = new Image();
  img.decoding = "async";
  img.src = pinataPortraitSrc(typeId);
  await img.decode();

  const srcW = Math.max(1, img.naturalWidth);
  const srcH = Math.max(1, img.naturalHeight);
  const scale = Math.min(1, SILHOUETTE_MAX / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return pinataPortraitSrc(typeId);
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  punchBackdrop(image);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function punchBackdrop(image: ImageData): void {
  const { data, width: w, height: h } = image;
  const n = w * h;
  const seen = new Uint8Array(n);
  const stack: number[] = [];

  const nearBlack = (i: number): boolean => {
    const p = i * 4;
    return data[p]! + data[p + 1]! + data[p + 2]! <= BG_LUMA * 3 && data[p + 3]! > 8;
  };

  const push = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (seen[i] || !nearBlack(i)) return;
    seen[i] = 1;
    stack.push(i);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    if (seen[i] || data[p + 3]! < 8) {
      data[p] = 0;
      data[p + 1] = 0;
      data[p + 2] = 0;
      data[p + 3] = 0;
    } else {
      data[p] = 0;
      data[p + 1] = 0;
      data[p + 2] = 0;
      data[p + 3] = 255;
    }
  }
}
