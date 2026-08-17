import type { DbCluster } from "../entities/DbCluster";

export type ExecuteQueryValue = string | number | boolean | null | ExecuteQueryValue[];

export type ExecuteQueryData = {
  columns: Array<{
    name: string;
    typeName?: string;
    type?: number;
    nullable?: number;
  }>;
  records: ExecuteQueryValue[][];
  numberOfRecordsUpdated?: number;
};

export type TableColumn = {
  name: string;
  typeName?: string;
  nullable?: boolean;
  defaultValue?: string | null;
};

export interface DbClusterRepository {
  listDataApiEnabledClusters(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
  }): Promise<DbCluster[]>;

  testDataApiConnection(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
  }): Promise<void>;

  listTables(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    engine?: "postgresql" | "mysql";
  }): Promise<string[]>;

  listTableColumns(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    tableName: string;
    engine?: "postgresql" | "mysql";
  }): Promise<TableColumn[]>;

  executeQuery(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    sql: string;
  }): Promise<ExecuteQueryData>;
}
