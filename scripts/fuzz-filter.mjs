// Checks that the proposed filter matches every input hasExportAllCandidate accepts
// Usage: node scripts/fuzz-filter.mjs [samples=500000]
import { hasExportAllCandidate } from "../node_modules/vinext/dist/plugins/strip-server-exports.js";

const samples = Number(process.argv[2] ?? 500_000);
const PROPOSED = /\bexport\s*[*/]/;
const parts = ["export", " ", "\n", "\t", " ", "*", "/", "/*", "*/", "//", "a", "$", "_", "1", "{"];

let accepted = 0;
const missed = [];
for (let s = 0; s < samples; s++) {
  let code = "";
  const length = 1 + Math.floor(Math.random() * 10);
  for (let p = 0; p < length; p++) code += parts[Math.floor(Math.random() * parts.length)];
  if (!hasExportAllCandidate(code)) continue;
  accepted++;
  if (!PROPOSED.test(code)) missed.push(code);
}

console.log(`${samples} random strings, ${accepted} accepted by hasExportAllCandidate, ${missed.length} missed by the proposed filter`);
for (const code of missed.slice(0, 10)) console.log(JSON.stringify(code));
if (missed.length > 0) process.exitCode = 1;
