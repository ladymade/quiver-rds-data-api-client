import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../shared/types/ipc";
import { ExecuteQueryUseCase } from "../../application/usecases/ExecuteQueryUseCase";
import { ListDbClustersUseCase } from "../../application/usecases/ListDbClustersUseCase";
import { TestConnectionUseCase } from "../../application/usecases/TestConnectionUseCase";
import { DbClusterRepository } from "../../infrastructure/aws/DbClusterRepository";
import { throwIfFaultInjected } from "./e2eFaultInjection";

function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const parts: string[] = [];

    if (error.name.length > 0) {
      parts.push(`Error: ${error.name}`);
    }

    if (error.message.length > 0) {
      parts.push(`Message: ${error.message}`);
    }

    return parts.join("\n");
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error != null && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof record.name === "string" && record.name.length > 0) {
      parts.push(`Error: ${record.name}`);
    }

    if (typeof record.message === "string" && record.message.length > 0) {
      parts.push(`Message: ${record.message}`);
    }

    const metadata = record.$metadata;
    if (metadata != null && typeof metadata === "object") {
      const statusCode = (metadata as { httpStatusCode?: number }).httpStatusCode;
      if (typeof statusCode === "number") {
        parts.push(`Status Code: ${statusCode}`);
      }
    }

    if (parts.length > 0) {
      return parts.join("\n");
    }

    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }

  return "Unknown AWS error.";
}

export function registerRdsIpcHandlers(): void {
  const repository = new DbClusterRepository();
  const listClustersUseCase = new ListDbClustersUseCase(repository);
  const testConnectionUseCase = new TestConnectionUseCase(repository);
  const executeQueryUseCase = new ExecuteQueryUseCase(repository);

  ipcMain.handle(
    IPC_CHANNELS.LIST_DB_CLUSTERS,
    async (
      _event,
      params: { profileName: string; region: string; credentialsDirectory?: string }
    ) => {
      try {
        throwIfFaultInjected("rds:list-db-clusters:throw", "Injected failure for listDbClusters.");
        const clusters = await listClustersUseCase.execute(params);
        return { clusters };
      } catch (error) {
        const details = formatErrorDetails(error);
        return {
          clusters: [],
          error: {
            message: details,
            details,
          },
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEST_CONNECTION,
    async (
      _event,
      params: {
        profileName: string;
        region: string;
        credentialsDirectory?: string;
        resourceArn: string;
        secretArn: string;
        database: string;
        engine?: "postgresql" | "mysql";
      }
    ) => {
      try {
        throwIfFaultInjected("rds:test-connection:throw", "Injected failure for testConnection.");
        await testConnectionUseCase.execute(params);
        return {
          success: true,
          message: "Connection successful.",
        };
      } catch (error) {
        const details = formatErrorDetails(error);

        return {
          success: false,
          message: details,
          details,
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LIST_TABLES,
    async (
      _event,
      params: {
        profileName: string;
        region: string;
        credentialsDirectory?: string;
        resourceArn: string;
        secretArn: string;
        database: string;
      }
    ) => {
      try {
        throwIfFaultInjected("rds:list-tables:throw", "Injected failure for listTables.");
        const tables = await repository.listTables(params);
        return { tables };
      } catch (error) {
        const details = formatErrorDetails(error);
        return {
          tables: [],
          error: {
            message: details,
            details,
          },
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LIST_TABLE_COLUMNS,
    async (
      _event,
      params: {
        profileName: string;
        region: string;
        credentialsDirectory?: string;
        resourceArn: string;
        secretArn: string;
        database: string;
        tableName: string;
        engine?: "postgresql" | "mysql";
      }
    ) => {
      try {
        throwIfFaultInjected(
          "rds:list-table-columns:throw",
          "Injected failure for listTableColumns."
        );
        const columns = await repository.listTableColumns(params);
        return { columns };
      } catch (error) {
        const details = formatErrorDetails(error);
        return {
          columns: [],
          error: {
            message: details,
            details,
          },
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.EXECUTE_QUERY,
    async (
      _event,
      params: {
        profileName: string;
        region: string;
        credentialsDirectory?: string;
        resourceArn: string;
        secretArn: string;
        database: string;
        sql: string;
      }
    ) => {
      try {
        throwIfFaultInjected("rds:execute-query:throw", "Injected failure for executeQuery.");
        const data = await executeQueryUseCase.execute(params);
        return { success: true, data };
      } catch (error) {
        const details = formatErrorDetails(error);
        return {
          success: false,
          error: {
            message: details,
            details,
          },
        };
      }
    }
  );
}
