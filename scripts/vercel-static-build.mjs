import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });

const entries = [
  ["index.html", "index.html"],
  ["assets", "assets"],
  ["docs", "docs"],
  ["PANDUAN-LARAGON.md", "PANDUAN-LARAGON.md"]
];

for (const [source, target] of entries) {
  const sourcePath = join(root, source);
  if (existsSync(sourcePath)) {
    cpSync(sourcePath, join(dist, target), { recursive: true });
  }
}
