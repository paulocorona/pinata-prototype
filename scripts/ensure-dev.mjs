/**
 * Start the Vite dev server, or reuse it if port 5174 is already serving.
 * Used by the folder-open task so Cursor can bring the game up without
 * failing when a previous session left the server running.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 5174;
const HOST = "127.0.0.1";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isListening() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host: HOST }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

if (await isListening()) {
  console.log("  ➜  Local:   http://localhost:5174/");
  console.log("Dev server already running.");
  // Give the VS Code problem matcher a tick to see "Local:" before we exit.
  await new Promise((resolve) => setTimeout(resolve, 250));
  process.exit(0);
}

const child = spawn("npm", ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
