#!/usr/bin/env node

const esbuild = require("esbuild");

const isWatch = process.argv.includes("--watch");

// Preload runs in a sandboxed renderer whose require() polyfill cannot resolve
// relative local modules, so it must ship as a single bundled file.
const buildOptions = {
  entryPoints: ["src/preload/index.ts"],
  outfile: "dist/preload/index.js",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["electron"],
  sourcemap: true,
  logLevel: "info",
};

async function run() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("[build-preload] watching for changes...");
  } else {
    await esbuild.build(buildOptions);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
