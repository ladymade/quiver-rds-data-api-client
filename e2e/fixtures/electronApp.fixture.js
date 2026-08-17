const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const electronBinaryPath = require("electron");
const { test: base, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");

const test = base.extend({
  userDataDir: async ({}, use) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "quiver-e2e-"));
    await use(directory);
    await fs.rm(directory, { recursive: true, force: true });
  },

  electronApp: async ({ userDataDir }, use) => {
    const app = await electron.launch({
      executablePath: electronBinaryPath,
      args: ["."],
      env: {
        ...process.env,
        NODE_ENV: "production",
        QUVER_USER_DATA_DIR: userDataDir,
      },
    });

    await use(app);
    await app.close();
  },

  page: async ({ electronApp }, use) => {
    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState("domcontentloaded");
    await use(firstWindow);
  },
});

module.exports = { test, expect };