/**
 * Keep http://localhost:5174 answering even while Vite restarts.
 *
 * Simple Browser shows a sticky "Connection Failed" page when 5174 drops,
 * and it does not retry. This process daemonizes, binds 5174 as a gateway,
 * serves a tiny auto-refresh page whenever Vite is down, and respawns Vite
 * on 5175. The parent prints "Local:" and exits so agent shells can die
 * without taking the game with them.
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_PORT = 5174;
const VITE_PORT = 5175;
const HOST = "127.0.0.1";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const self = fileURLToPath(import.meta.url);

const RETRY_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="1" />
    <title>Piñata — starting</title>
    <style>
      html, body { height: 100%; margin: 0; background: #1a1020; color: #fff8ef;
        font-family: Nunito, Segoe UI, sans-serif; display: grid; place-items: center; }
      p { font-size: 18px; letter-spacing: 0.02em; }
    </style>
  </head>
  <body>
    <p>Starting game…</p>
    <script>setTimeout(() => location.reload(), 700);</script>
  </body>
</html>`;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpOk(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: HOST, port, path: "/", timeout: timeoutMs },
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

function listeningPids(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync("netstat -ano -p tcp", { encoding: "utf8" });
      const pids = new Set();
      const re = new RegExp(`:${port}\\s`);
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING") || !re.test(line)) continue;
        const pid = Number(line.trim().split(/\s+/).pop());
        if (pid > 0 && pid !== process.pid) pids.add(pid);
      }
      return [...pids];
    }
    const out = execSync(`lsof -t -iTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\s+/)
      .map(Number)
      .filter((pid) => pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } else {
        process.kill(pid, "SIGTERM");
      }
    } catch {
      /* already gone */
    }
  }
}

function rewriteHeaders(headers) {
  const next = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value == null || HOP_BY_HOP.has(key.toLowerCase())) continue;
    next[key] = value;
  }
  next.host = `${HOST}:${VITE_PORT}`;
  return next;
}

function serveRetry(res) {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Pinata-Gateway": "1",
  });
  res.end(RETRY_HTML);
}

function proxyHttp(req, res) {
  const p = http.request(
    {
      hostname: HOST,
      port: VITE_PORT,
      path: req.url,
      method: req.method,
      headers: rewriteHeaders(req.headers),
      timeout: 8000,
    },
    (pres) => {
      const headers = { ...pres.headers, "X-Pinata-Gateway": "1" };
      res.writeHead(pres.statusCode ?? 502, headers);
      pres.pipe(res);
    },
  );
  p.on("timeout", () => {
    p.destroy();
    serveRetry(res);
  });
  p.on("error", () => serveRetry(res));
  req.on("aborted", () => p.destroy());
  req.pipe(p);
}

function proxyUpgrade(req, clientSocket, head) {
  const proxy = net.connect(VITE_PORT, HOST, () => {
    let header = `${req.method} ${req.url} HTTP/1.1\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      let value = req.rawHeaders[i + 1];
      if (key.toLowerCase() === "host") value = `${HOST}:${VITE_PORT}`;
      header += `${key}: ${value}\r\n`;
    }
    header += "\r\n";
    proxy.write(header);
    if (head.length) proxy.write(head);
    proxy.pipe(clientSocket);
    clientSocket.pipe(proxy);
  });
  proxy.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => proxy.destroy());
}

function listenPublic() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      proxyHttp(req, res);
    });
    server.on("upgrade", proxyUpgrade);
    server.on("error", reject);
    server.listen(PUBLIC_PORT, "0.0.0.0", () => {
      server.off("error", reject);
      server.on("error", (err) => {
        console.error("Gateway error:", err);
      });
      resolve(server);
    });
  });
}

let viteChild = null;
let viteStartAt = 0;

function spawnVite() {
  if (viteChild) return;
  viteStartAt = Date.now();
  viteChild = spawn("npm run dev", {
    cwd: root,
    stdio: "ignore",
    shell: true,
    windowsHide: true,
    env: { ...process.env, PINATA_VITE_PORT: String(VITE_PORT) },
  });
  viteChild.on("error", () => {
    viteChild = null;
  });
  viteChild.on("exit", () => {
    viteChild = null;
  });
}

async function maintainVite() {
  for (;;) {
    const up = await httpOk(VITE_PORT);
    if (up) {
      await sleep(2000);
      continue;
    }
    if (viteChild && Date.now() - viteStartAt > 20_000) {
      const child = viteChild;
      viteChild = null;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      killPids(listeningPids(VITE_PORT));
      await sleep(400);
    }
    spawnVite();
    await sleep(1500);
  }
}

async function acquirePort() {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await listenPublic();
    } catch (err) {
      if (err?.code !== "EADDRINUSE") throw err;
      if (await httpOk(PUBLIC_PORT)) return null;
      await sleep(1500);
      if (await httpOk(PUBLIC_PORT)) return null;
      killPids(listeningPids(PUBLIC_PORT));
      await sleep(400);
    }
  }
  return null;
}

async function runGateway() {
  process.on("uncaughtException", (err) => {
    console.error("Gateway error:", err);
  });
  process.on("unhandledRejection", (err) => {
    console.error("Gateway rejection:", err);
  });

  const server = await acquirePort();
  if (!server) return;
  await maintainVite();
}

async function waitUntilPublic(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await httpOk(PUBLIC_PORT, 800)) return true;
    await sleep(200);
  }
  return false;
}

if (process.env.PINATA_GATEWAY_CHILD === "1") {
  await runGateway();
} else {
  if (!(await httpOk(PUBLIC_PORT))) {
    const child = spawn(process.execPath, [self], {
      cwd: root,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env, PINATA_GATEWAY_CHILD: "1" },
    });
    child.unref();
  }
  const ready = await waitUntilPublic();
  console.log("  ➜  Local:   http://localhost:5174/");
  if (!ready) {
    console.error("Gateway did not come up on port 5174.");
    process.exit(1);
  }
  console.log("Dev server ready.");
}
