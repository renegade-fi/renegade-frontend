#!/usr/bin/env node
/**
 * When NEXT_PUBLIC_TCA_ONLY_MODE=true, inject
 *   export const dynamic = "force-dynamic";
 * into app/layout.tsx before `next build` runs.
 *
 * Why: Next.js requires route-segment config (`dynamic`) to be a literal at
 * the AST level — conditional expressions are rejected. We need the export
 * present in TCA-only builds (so prerender of non-/tca pages is skipped and
 * doesn't crash on the stripped providers), and absent in normal builds (so
 * the main app keeps its prerender behavior). Codegen at build time is the
 * cleanest way to satisfy both without source-level duplication.
 */
const fs = require("node:fs");
const path = require("node:path");

const layoutPath = path.join(__dirname, "..", "app", "layout.tsx");
const markerLine = /^\/\/ TCA_ONLY_DYNAMIC_MARKER\s*$/m;
const injection = 'export const dynamic = "force-dynamic";';

const tcaOnly = process.env.NEXT_PUBLIC_TCA_ONLY_MODE === "true";

if (!tcaOnly) {
    process.exit(0);
}

const src = fs.readFileSync(layoutPath, "utf8");

if (/^export const dynamic = "force-dynamic";\s*$/m.test(src)) {
    console.log("[inject-tca-dynamic] dynamic export already present, skipping.");
    process.exit(0);
}

if (!markerLine.test(src)) {
    console.error(`[inject-tca-dynamic] marker line not found in ${layoutPath}.`);
    process.exit(1);
}

fs.writeFileSync(layoutPath, src.replace(markerLine, injection));
console.log("[inject-tca-dynamic] injected force-dynamic export into app/layout.tsx");
