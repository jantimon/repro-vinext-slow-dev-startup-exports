// Runs scripts/dev-once.mjs with the shipped and the patched vinext, alternating,
// after one discarded warm-up run each. Prints medians
// Usage: node scripts/compare.mjs [runs=5]
import { execFileSync } from "node:child_process";
import { setPatched } from "./patch.mjs";

const runs = Number(process.argv[2] ?? 5);
const variants = ["shipped", "patched"];
const results = { shipped: [], patched: [] };

function devOnce(variant) {
  setPatched(variant === "patched");
  const output = execFileSync("node", ["scripts/dev-once.mjs"], { encoding: "utf8" });
  return JSON.parse(output.trim().split("\n").at(-1));
}

try {
  for (const variant of variants) devOnce(variant);
  for (let r = 0; r < runs; r++) {
    for (const variant of variants) {
      const result = devOnce(variant);
      results[variant].push(result);
      console.log(`run ${r + 1} ${variant}: ${JSON.stringify(result)}`);
    }
  }
} finally {
  setPatched(false);
}

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const ms = (variant, key) => `${Math.round(median(results[variant].map((result) => result[key])))} ms`;

console.log(`\nmedian of ${runs} runs\n`);
console.log("| vinext 1.0.0 | first HTML | client modules | time in filter regex | filter calls |");
console.log("|---|---:|---:|---:|---:|");
for (const variant of variants) {
  const calls = median(results[variant].map((result) => result.filterCalls));
  console.log(`| ${variant} | ${ms(variant, "ssrMs")} | ${ms(variant, "clientMs")} | ${ms(variant, "filterMs")} | ${calls} |`);
}
const rejected = variants.every((variant) => results[variant].every((result) => result.rejected.length === 2));
console.log(`\nboth variants reject export * in pages: ${rejected ? "yes" : "NO"}`);
