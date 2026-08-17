#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const isLinux = process.platform === "linux";

if (!isLinux) {
  process.exit(0);
}

const result = spawnSync("wine", ["--version"], { encoding: "utf8" });

if (result.status !== 0) {
  console.error("[check:win-env] wine was not found.");
  console.error("Install wine before running Windows packaging on Linux.");
  console.error("Debian/Ubuntu example:");
  console.error("  sudo dpkg --add-architecture i386");
  console.error("  sudo apt-get update");
  console.error("  sudo apt-get install wine wine32 wine64 wine-binfmt mono-runtime");
  process.exit(1);
}

const version = (result.stdout || result.stderr || "").trim();
console.log(`[check:win-env] ${version}`);
