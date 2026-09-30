// Runs the shipped and the proposed filter regex over one generated module
// per size and prints the median time per module
// Usage: node scripts/regex-bench.mjs [runs=7]
import { moduleSource } from "./source.mjs";

const runs = Number(process.argv[2] ?? 7);
const SHIPPED = /\bexport\b[\s\S]*\*/;
const PROPOSED = /\bexport\s*[*/]/;

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];

function time(regex, code) {
  const samples = [];
  for (let r = 0; r < runs; r++) {
    const start = performance.now();
    regex.test(code);
    samples.push(performance.now() - start);
  }
  return median(samples);
}

console.log("| exports | size | shipped regex | proposed regex |");
console.log("|---:|---:|---:|---:|");
for (const count of [100, 200, 400, 800, 1600, 3200]) {
  const code = moduleSource(0, count);
  const kb = (code.length / 1024).toFixed(0);
  console.log(`| ${count} | ${kb} KB | ${time(SHIPPED, code).toFixed(2)} ms | ${time(PROPOSED, code).toFixed(3)} ms |`);
}
