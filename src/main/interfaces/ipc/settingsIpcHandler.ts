import { ipcMain } from "electron";
import { IPC_CHANNELS, type SettingsDto } from "../../../shared/types/ipc";
import { GetSettingsUseCase } from "../../application/usecases/GetSettingsUseCase";
import { SaveSettingsUseCase } from "../../application/usecases/SaveSettingsUseCase";
import { SettingsRepository } from "../../infrastructure/storage/SettingsRepository";
import { throwIfFaultInjected } from "./e2eFaultInjection";

export function registerSettingsIpcHandlers(): void {
  const repository = new SettingsRepository();
  const getUseCase = new GetSettingsUseCase(repository);
  const saveUseCase = new SaveSettingsUseCase(repository);

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    throwIfFaultInjected("settings:get:throw", "Injected failure for getSettings.");
    const settings = await getUseCase.execute();
    return { settings };
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_event, settings: SettingsDto) => {
    try {
      throwIfFaultInjected("settings:save:throw", "Injected failure for saveSettings.");
      await saveUseCase.execute(settings);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Failed to save settings.",
      };
    }
  });
}
