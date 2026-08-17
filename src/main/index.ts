import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { BrowserWindow, app } from "electron";
import { AppErrorLogRepository } from "./infrastructure/storage/AppErrorLogRepository";
import { registerConnectionProfileIpcHandlers } from "./interfaces/ipc/connectionProfileIpcHandler";
import { registerCredentialsIpcHandlers } from "./interfaces/ipc/credentialsIpcHandler";
import { registerErrorLogIpcHandlers } from "./interfaces/ipc/errorLogIpcHandler";
import { registerRdsIpcHandlers } from "./interfaces/ipc/rdsIpcHandler";

const isDev = process.env.NODE_ENV === "development";
const rendererUrl = process.env.VITE_DEV_SERVER_URL?.trim() || "http://127.0.0.1:5173";
const appErrorLogRepository = new AppErrorLogRepository();

// Dev containers' forwarded displays lack real GPU support, which crashes Chromium's
// GPU process and leaves the window blank; disable hardware acceleration to avoid this.
app.disableHardwareAcceleration();

const e2eUserDataDir = process.env.QUVER_USER_DATA_DIR?.trim();
if (e2eUserDataDir != null && e2eUserDataDir.length > 0) {
  app.setPath("userData", e2eUserDataDir);
}

async function waitForLoad(mainWindow: BrowserWindow, url: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${url}`));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      mainWindow.webContents.off("did-finish-load", onFinish);
      mainWindow.webContents.off("did-fail-load", onFail);
    };

    const onFinish = () => {
      cleanup();
      resolve();
    };

    const onFail = (_event: Electron.Event, errorCode: number, errorDescription: string) => {
      cleanup();
      reject(new Error(`Failed to load ${url}: ${errorCode} ${errorDescription}`));
    };

    mainWindow.webContents.once("did-finish-load", onFinish);
    mainWindow.webContents.once("did-fail-load", onFail);
    void mainWindow.loadURL(url);
  });
}

async function loadDevServer(mainWindow: BrowserWindow): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await waitForLoad(mainWindow, rendererUrl);
      return;
    } catch {
      await delay(500);
    }
  }

  throw new Error(`Failed to load dev server at ${rendererUrl}`);
}

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    await loadDevServer(mainWindow);
    // Open DevTools only when explicitly requested (F12) to avoid CDP version mismatch errors.
    mainWindow.webContents.on("before-input-event", (_event, input) => {
      if (input.key === "F12") {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools();
        }
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerCredentialsIpcHandlers();
  registerErrorLogIpcHandlers();
  registerRdsIpcHandlers();
  registerConnectionProfileIpcHandlers();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (error) => {
  void appErrorLogRepository.append({
    timestamp: new Date().toISOString(),
    source: "main:uncaughtException",
    message: error.message,
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  void appErrorLogRepository.append({
    timestamp: new Date().toISOString(),
    source: "main:unhandledRejection",
    message: error.message,
    stack: error.stack,
  });
});
