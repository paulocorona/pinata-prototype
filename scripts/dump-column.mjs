import { readFileSync } from "fs";
import { PNG } from "pngjs";

const path = process.argv[2];
const png = PNG.sync.read(readFileSync(path));
const { width, data } = png;
const xs = [452, 664, 375, 873];
const starts = [376, 320, 355, 323];

const px = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};

for (let i = 0; i < xs.length; i++) {
  const x = xs[i];
  const y0 = starts[i];
  console.log(`\n=== rope x=${x} endY=${y0} ===`);
  for (let y = y0 - 2; y <= y0 + 40; y++) {
    const [r, g, b] = px(x, y);
    const mark = y === y0 ? " <end" : "";
    console.log(`y=${y} rgb=${r},${g},${b}${mark}`);
  }
}
