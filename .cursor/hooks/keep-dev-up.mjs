/**
 * If http://localhost:5174 is down, start the gateway in the background.
 * Used as a sessionStart/stop hook so a finished agent turn cannot leave
 * Simple Browser on Connection Failed.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

await new Promise((resolve) => {
  process.stdin.on("data", () => {});
  process.stdin.on("end", resolve);
  if (process.stdin.readableEnded) resolve();
  setTimeout(resolve, 500);
});

function httpOk() {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: 5174, path: "/", timeout: 1500 },
      (res) => {
        res.resume();
        resolve((res.statusCode ?? 500) < 500);
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

if (!(await httpOk())) {
  const child = spawn(process.execPath, [path.join(root, "scripts/ensure-dev.mjs")], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

process.stdout.write("{}\n");
