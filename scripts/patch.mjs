// Applies or reverts patches/vinext-1.0.0-export-all-filter.patch on node_modules/vinext
// Usage: node scripts/patch.mjs apply|revert
import { readFileSync, writeFileSync } from "node:fs";

const TARGET = "node_modules/vinext/dist/index.js";
const SHIPPED = String.raw`code: /\bexport\b[\s\S]*\*/`;
const PATCHED = String.raw`code: /\bexport\s*[*/]/`;

export function isPatched() {
  return readFileSync(TARGET, "utf8").includes(PATCHED);
}

export function setPatched(wanted) {
  if (isPatched() === wanted) return;
  const [from, to] = wanted ? [SHIPPED, PATCHED] : [PATCHED, SHIPPED];
  const source = readFileSync(TARGET, "utf8");
  if (source.split(from).length !== 2) throw new Error(`expected one ${from} in ${TARGET}`);
  writeFileSync(TARGET, source.replace(from, to));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];
  if (mode !== "apply" && mode !== "revert") throw new Error("usage: patch.mjs apply|revert");
  setPatched(mode === "apply");
  console.log(`vinext ${isPatched() ? "patched" : "unpatched"}`);
}
