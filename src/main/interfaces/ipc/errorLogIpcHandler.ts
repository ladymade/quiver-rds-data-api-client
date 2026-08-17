import { ipcMain } from "electron";
import { IPC_CHANNELS, type UnexpectedErrorLogPayload } from "../../../shared/types/ipc";
import { AppErrorLogRepository } from "../../infrastructure/storage/AppErrorLogRepository";

export function registerErrorLogIpcHandlers(): void {
  const repository = new AppErrorLogRepository();

  ipcMain.handle(
    IPC_CHANNELS.LOG_UNEXPECTED_ERROR,
    async (_event, payload: UnexpectedErrorLogPayload) => {
      await repository.append({
        timestamp: new Date().toISOString(),
        source: payload.source,
        message: payload.message,
        stack: payload.stack,
        metadata: payload.metadata,
      });
    }
  );
}
