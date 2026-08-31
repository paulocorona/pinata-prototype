import { readFileSync } from "fs";
import { PNG } from "pngjs";

const path = process.argv[2];
const png = PNG.sync.read(readFileSync(path));
const { width, height, data } = png;

const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};

const isWhite = (r, g, b) => r > 200 && g > 200 && b > 200 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
const isSky = (r, g, b) => b > r + 15 && b > g && b > 140 && r < 200;
const isPinata = (r, g, b) => {
  if (isWhite(r, g, b) || isSky(r, g, b)) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min > 40 && max > 90;
};

const ropes = [];
for (let x = 40; x < width - 40; x++) {
  let run = 0;
  let start = -1;
  let end = -1;
  for (let y = 0; y < Math.floor(height * 0.75); y++) {
    const [r, g, b] = px(x, y);
    if (isWhite(r, g, b)) {
      if (run === 0) start = y;
      run++;
      end = y;
    } else if (run > 0) {
      if (run > 40) {
        let pinataY = -1;
        for (let y2 = end + 1; y2 < Math.min(end + 80, height); y2++) {
          const c = px(x, y2);
          if (isPinata(c[0], c[1], c[2])) {
            pinataY = y2;
            break;
          }
        }
        ropes.push({ x, start, end, run, gap: pinataY < 0 ? null : pinataY - end - 1, pinataY });
      }
      run = 0;
    }
  }
}

// Merge nearby x columns into clusters
const clusters = [];
for (const r of ropes) {
  const last = clusters[clusters.length - 1];
  if (last && r.x - last.xs[last.xs.length - 1] <= 2) {
    last.xs.push(r.x);
    last.gaps.push(r.gap);
    last.ends.push(r.end);
    last.pinataYs.push(r.pinataY);
  } else {
    clusters.push({ xs: [r.x], gaps: [r.gap], ends: [r.end], pinataYs: [r.pinataY] });
  }
}

const summary = clusters
  .filter((c) => c.xs.length >= 1)
  .map((c) => {
    const mid = c.xs[Math.floor(c.xs.length / 2)];
    const gap = c.gaps.filter((g) => g != null);
    const avgGap = gap.length ? gap.reduce((a, b) => a + b, 0) / gap.length : null;
    return {
      x: mid,
      width: c.xs.length,
      ropeEndY: c.ends[Math.floor(c.ends.length / 2)],
      pinataY: c.pinataYs.find((y) => y != null) ?? null,
      gapPx: avgGap != null ? Math.round(avgGap) : null,
    };
  });

console.log(JSON.stringify({ width, height, ropeCount: summary.length, ropes: summary }, null, 2));
