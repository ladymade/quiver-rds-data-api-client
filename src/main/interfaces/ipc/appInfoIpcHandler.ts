import { app, ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../shared/types/ipc";

export function registerAppInfoIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => app.getVersion());
}
