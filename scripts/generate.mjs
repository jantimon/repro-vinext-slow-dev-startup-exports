// Generates a Pages Router app: one page that imports `modules` modules,
// each with `exports` named exports and no `*` character
// Usage: node scripts/generate.mjs [modules=200] [exports=400]
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { moduleSource } from "./source.mjs";

const [modules = 200, exports = 400] = process.argv.slice(2).map(Number);

rmSync("pages", { recursive: true, force: true });
rmSync("lib", { recursive: true, force: true });
mkdirSync("pages", { recursive: true });
mkdirSync("lib", { recursive: true });

for (let m = 0; m < modules; m++) writeFileSync(`lib/m${m}.js`, moduleSource(m, exports));

const imports = Array.from({ length: modules }, (_, m) => `import { label_${m}_0 } from "../lib/m${m}.js";`);
const labels = Array.from({ length: modules }, (_, m) => `label_${m}_0`);
writeFileSync(
  "pages/index.jsx",
  `${imports.join("\n")}

const labels = [${labels.join(", ")}];

export default function Page() {
  return <main>{labels.length} modules</main>;
}
`,
);

// Pages vinext must reject in both variants
writeFileSync("pages/export-all.jsx", `export * from "../lib/m0.js";\nexport default function Page() {\n  return null;\n}\n`);
writeFileSync(
  "pages/export-all-comment.jsx",
  `export /* comment */ * from "../lib/m0.js";\nexport default function Page() {\n  return null;\n}\n`,
);

console.log(`generated ${modules} modules with ${exports} exports each`);
