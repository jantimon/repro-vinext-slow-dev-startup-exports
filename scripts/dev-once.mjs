// Starts the Vite dev server in this process, requests `/` and then every
// client module the page loads, like a browser. Prints one JSON line
import { createServer } from "vite";

const FILTER_PLUGIN = "vinext:validate-page-exports";

// vinext patches the global fetch once loaded
const nativeFetch = globalThis.fetch;
const server = await createServer({ logLevel: "error", server: { host: "127.0.0.1", port: 0 } });

// Time every evaluation of the plugin's `code` filter regex
const plugin = server.config.plugins.find((p) => p.name === FILTER_PLUGIN);
const regex = plugin.transform.filter.code;
const filter = { calls: 0, ms: 0 };
regex.test = function (code) {
  const start = performance.now();
  const result = RegExp.prototype.test.call(this, code);
  filter.ms += performance.now() - start;
  filter.calls++;
  return result;
};

await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");

const start = performance.now();
const html = await (await nativeFetch(`${base}/`)).text();
const ssrMs = performance.now() - start;
if (!html.includes(" modules</main>")) throw new Error(`unexpected html: ${html.slice(0, 200)}`);

const importRe = /(?:\bimport|\bexport)\s*(?:[\w*{}\s,$]+from\s*)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/g;
// Six parallel requests, as browsers do per host
async function crawl(entries) {
  const seen = new Set(entries);
  const queue = [...entries];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      const code = await (await nativeFetch(new URL(url, base))).text();
      for (const match of code.matchAll(importRe)) {
        const spec = match[1] ?? match[2];
        if (spec.startsWith("/") && !seen.has(spec)) {
          seen.add(spec);
          queue.push(spec);
        }
      }
    }
  }
  // workers exit when the queue is momentarily empty, so loop until it stays empty
  while (queue.length > 0) await Promise.all(Array.from({ length: 6 }, worker));
  return seen.size;
}
const scripts = [...html.matchAll(/<script[^>]*\bsrc="(\/[^"]+)"/g)].map((m) => m[1]);
const clientStart = performance.now();
const clientModules = await crawl(scripts);
const clientMs = performance.now() - clientStart;

const rejected = [];
for (const page of ["/pages/export-all.jsx", "/pages/export-all-comment.jsx"]) {
  try {
    await server.environments.client.transformRequest(page);
  } catch (error) {
    if (String(error.message).includes("export-all-in-page")) rejected.push(page);
  }
}

console.log(JSON.stringify({ ssrMs, clientMs, clientModules, filterCalls: filter.calls, filterMs: filter.ms, rejected }));
await server.close();
