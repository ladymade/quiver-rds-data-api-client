import { contextBridge } from "electron";

// Expose safe APIs to the renderer process via contextBridge.
// Add typed API channels here as features are implemented.
contextBridge.exposeInMainWorld("quiverApi", {
  // placeholder - will be extended with IPC calls
});
