import { dialog, ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../shared/types/ipc";
import { ListAwsCredentialProfilesUseCase } from "../../application/usecases/ListAwsCredentialProfilesUseCase";
import { AwsCredentialProfileRepository } from "../../infrastructure/aws/AwsCredentialProfileRepository";
import { AWS_CREDENTIALS_NOT_READABLE_MESSAGE } from "../../infrastructure/aws/AwsCredentialsNotReadableError";
import { throwIfFaultInjected } from "./e2eFaultInjection";

export function registerCredentialsIpcHandlers(): void {
  const repository = new AwsCredentialProfileRepository();
  const useCase = new ListAwsCredentialProfilesUseCase(repository);

  ipcMain.handle(IPC_CHANNELS.LIST_AWS_CREDENTIAL_PROFILES, async () => {
    try {
      throwIfFaultInjected(
        "credentials:list:throw",
        "Injected failure for listAwsCredentialProfiles."
      );
      const profiles = await useCase.execute();
      return { profiles };
    } catch (error) {
      console.error("Failed to load AWS credential profiles", error);
      return {
        profiles: [],
        errorMessage: AWS_CREDENTIALS_NOT_READABLE_MESSAGE,
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.LIST_AWS_CREDENTIAL_PROFILES_FROM_DIRECTORY,
    async (_event, directoryPath: string) => {
      try {
        throwIfFaultInjected(
          "credentials:list-from-directory:throw",
          "Injected failure for listAwsCredentialProfilesFromDirectory."
        );
        const profiles = await useCase.execute(directoryPath);
        return { profiles, sourceDirectory: directoryPath };
      } catch (error) {
        console.error("Failed to load AWS credential profiles from directory", error);
        return {
          profiles: [],
          sourceDirectory: directoryPath,
          errorMessage: AWS_CREDENTIALS_NOT_READABLE_MESSAGE,
        };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SELECT_AWS_CREDENTIALS_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select AWS credentials directory",
      buttonLabel: "Use this directory",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return {
      canceled: false,
      directoryPath: result.filePaths[0],
    };
  });
}
