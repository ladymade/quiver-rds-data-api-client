import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../shared/types/ipc";
import { CreateConnectionProfileUseCase } from "../../application/usecases/CreateConnectionProfileUseCase";
import { DeleteConnectionProfileUseCase } from "../../application/usecases/DeleteConnectionProfileUseCase";
import { ListConnectionProfilesUseCase } from "../../application/usecases/ListConnectionProfilesUseCase";
import { UpdateConnectionProfileUseCase } from "../../application/usecases/UpdateConnectionProfileUseCase";
import { DbClusterRepository } from "../../infrastructure/aws/DbClusterRepository";
import { ConnectionProfileRepository } from "../../infrastructure/storage/ConnectionProfileRepository";
import { throwIfFaultInjected } from "./e2eFaultInjection";

export function registerConnectionProfileIpcHandlers(): void {
  const repository = new ConnectionProfileRepository();
  const dbClusterRepository = new DbClusterRepository();
  const createUseCase = new CreateConnectionProfileUseCase(repository);
  const updateUseCase = new UpdateConnectionProfileUseCase(repository);
  const deleteUseCase = new DeleteConnectionProfileUseCase(repository);
  const listUseCase = new ListConnectionProfilesUseCase(repository);

  const resolveProfileCluster = async (profile: {
    name: string;
    credentialProfileName: string;
    region: string;
    credentialsDirectory: string | null;
    clusterArn: string;
    secretArn: string;
    database: string;
    engine?: "postgresql" | "mysql";
  }) => {
    const clusters = await dbClusterRepository.listDataApiEnabledClusters({
      profileName: profile.credentialProfileName,
      region: profile.region,
      credentialsDirectory: profile.credentialsDirectory ?? undefined,
    });

    const matchedCluster = clusters.find((cluster) => cluster.clusterArn === profile.clusterArn);

    if (matchedCluster == null) {
      throw new Error(
        "The specified cluster ARN could not be found among available Data API-enabled clusters."
      );
    }

    return {
      ...profile,
      engine: matchedCluster.engine,
    };
  };

  ipcMain.handle(IPC_CHANNELS.LIST_CONNECTION_PROFILES, async () => {
    throwIfFaultInjected("profiles:list:throw", "Injected failure for listConnectionProfiles.");
    const profiles = await listUseCase.execute();
    return { profiles };
  });

  ipcMain.handle(
    IPC_CHANNELS.CREATE_CONNECTION_PROFILE,
    async (
      _event,
      profile: {
        name: string;
        credentialProfileName: string;
        region: string;
        credentialsDirectory: string | null;
        clusterArn: string;
        secretArn: string;
        database: string;
        engine?: "postgresql" | "mysql";
      }
    ) => {
      try {
        throwIfFaultInjected(
          "profiles:create:throw",
          "Injected failure for createConnectionProfile."
        );
        const resolvedProfile = await resolveProfileCluster(profile);
        await createUseCase.execute(resolvedProfile);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          errorMessage: error instanceof Error ? error.message : "Failed to create profile.",
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.UPDATE_CONNECTION_PROFILE,
    async (
      _event,
      params: {
        previousName: string;
        profile: {
          name: string;
          credentialProfileName: string;
          region: string;
          credentialsDirectory: string | null;
          clusterArn: string;
          secretArn: string;
          database: string;
          engine?: "postgresql" | "mysql";
        };
      }
    ) => {
      try {
        throwIfFaultInjected(
          "profiles:update:throw",
          "Injected failure for updateConnectionProfile."
        );
        const resolvedProfile = await resolveProfileCluster(params.profile);
        await updateUseCase.execute(params.previousName, resolvedProfile);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          errorMessage: error instanceof Error ? error.message : "Failed to update profile.",
        };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.DELETE_CONNECTION_PROFILE, async (_event, name: string) => {
    try {
      throwIfFaultInjected(
        "profiles:delete:throw",
        "Injected failure for deleteConnectionProfile."
      );
      await deleteUseCase.execute(name);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Failed to delete profile.",
      };
    }
  });
}
