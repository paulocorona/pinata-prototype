import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import { formatUpgradeLayoutSource } from "./src/game/upgradeLayoutFile";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function upgradeLayoutPlugin(): Plugin {
  return {
    name: "upgrade-layout-writer",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/__upgrade-layout",
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== "POST") {
            next();
            return;
          }
          void (async () => {
            try {
              const body = JSON.parse(await readBody(req)) as {
                cols: number;
                rows: number;
                layout: Record<string, { col: number; row: number }>;
                order: string[];
              };
              if (!body.order?.length || !body.layout || !body.cols || !body.rows) {
                res.statusCode = 400;
                res.end("Invalid layout payload");
                return;
              }
              const seen = new Set<string>();
              for (const id of body.order) {
                const pos = body.layout[id];
                if (!pos) {
                  res.statusCode = 400;
                  res.end(`Missing position for ${id}`);
                  return;
                }
                if (
                  pos.col < 0 ||
                  pos.row < 0 ||
                  pos.col >= body.cols ||
                  pos.row >= body.rows
                ) {
                  res.statusCode = 400;
                  res.end(`${id} is outside the grid`);
                  return;
                }
                const key = `${pos.col},${pos.row}`;
                if (seen.has(key)) {
                  res.statusCode = 400;
                  res.end(`Two upgrades share cell ${key}`);
                  return;
                }
                seen.add(key);
              }
              const file = path.resolve(server.config.root, "src/game/upgradeLayout.ts");
              fs.writeFileSync(
                file,
                formatUpgradeLayoutSource(
                  { cols: body.cols, rows: body.rows },
                  body.layout,
                  body.order,
                ),
                "utf8",
              );
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(err instanceof Error ? err.message : "Save failed");
            }
          })();
        },
      );
    },
  };
}

export default defineConfig({
  root: ".",
  base: process.env.GITHUB_PAGES === "true" ? "/pinata-prototype/" : "/",
  plugins: [upgradeLayoutPlugin()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    open: false,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: process.env.GITHUB_PAGES !== "true",
    emptyOutDir: true,
  },
});
