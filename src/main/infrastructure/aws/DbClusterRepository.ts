import path from "node:path";
import { DescribeDBClustersCommand, RDSClient } from "@aws-sdk/client-rds";
import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";
import { fromIni } from "@aws-sdk/credential-providers";
import type { DbCluster } from "../../domain/entities/DbCluster";
import type {
  DbClusterRepository as DbClusterRepositoryPort,
  ExecuteQueryData,
  ExecuteQueryValue,
  TableColumn,
} from "../../domain/repositories/DbClusterRepository";
import {
  assertAwsCredentialsDirectoryReadable,
  toAwsCredentialsNotReadableError,
} from "./AwsCredentialsNotReadableError";

export class DbClusterRepository implements DbClusterRepositoryPort {
  private readonly supportedEngines = {
    postgresql: "postgresql",
    mysql: "mysql",
  } as const;

  async listDataApiEnabledClusters(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
  }): Promise<DbCluster[]> {
    const credentials = await this.createCredentials(
      params.profileName,
      params.credentialsDirectory
    );
    const client = new RDSClient({
      region: params.region,
      credentials,
      endpoint: params.profileName === "ministack" ? "http://localhost:4566" : undefined,
    });

    const clusters: DbCluster[] = [];
    let marker: string | undefined;

    while (true) {
      const command = new DescribeDBClustersCommand({ Marker: marker });
      const response = await client.send(command);

      if (response.DBClusters != null) {
        for (const cluster of response.DBClusters) {
          if (cluster.DBClusterArn == null || cluster.DBClusterIdentifier == null) {
            continue;
          }

          if (cluster.HttpEndpointEnabled !== true) {
            continue;
          }

          const engine = this.normalizeEngine(cluster.Engine);
          if (engine == null) {
            continue;
          }

          clusters.push({
            clusterArn: cluster.DBClusterArn,
            identifier: cluster.DBClusterIdentifier,
            endpoint: cluster.Endpoint,
            engine,
          });
        }
      }

      if (response.Marker == null || response.Marker.length === 0) {
        break;
      }

      marker = response.Marker;
    }

    return clusters;
  }

  async testDataApiConnection(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
  }): Promise<void> {
    const credentials = await this.createCredentials(
      params.profileName,
      params.credentialsDirectory
    );

    const client = new RDSDataClient({
      region: params.region,
      credentials,
      endpoint: params.profileName === "ministack" ? "http://localhost:4566" : undefined,
    });

    await client.send(
      new ExecuteStatementCommand({
        resourceArn: params.resourceArn,
        secretArn: params.secretArn,
        database: params.database,
        sql: "SELECT 1",
      })
    );
  }

  async listTables(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    engine?: "postgresql" | "mysql";
  }): Promise<string[]> {
    const credentials = await this.createCredentials(
      params.profileName,
      params.credentialsDirectory
    );

    const client = new RDSDataClient({
      region: params.region,
      credentials,
      endpoint: params.profileName === "ministack" ? "http://localhost:4566" : undefined,
    });

    const postgresSql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_catalog = :databaseName
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const mysqlSql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = :databaseName
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    if (params.engine == null) {
      throw new Error("Database engine is not set in this profile.");
    }

    const sql = params.engine === this.supportedEngines.postgresql ? postgresSql : mysqlSql;

    if (
      params.engine !== this.supportedEngines.postgresql &&
      params.engine !== this.supportedEngines.mysql
    ) {
      throw new Error(`Unsupported database engine: ${params.engine}`);
    }

    const response = await client.send(
      new ExecuteStatementCommand({
        resourceArn: params.resourceArn,
        secretArn: params.secretArn,
        database: params.database,
        sql,
        parameters: [
          {
            name: "databaseName",
            value: { stringValue: params.database },
          },
        ],
      })
    );

    return this.extractTableNames(response.records);
  }

  async listTableColumns(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    tableName: string;
    engine?: "postgresql" | "mysql";
  }): Promise<TableColumn[]> {
    const credentials = await this.createCredentials(
      params.profileName,
      params.credentialsDirectory
    );

    const client = new RDSDataClient({
      region: params.region,
      credentials,
      endpoint: params.profileName === "ministack" ? "http://localhost:4566" : undefined,
    });

    const postgresSql = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_catalog = :databaseName
        AND table_schema = current_schema()
        AND table_name = :tableName
      ORDER BY ordinal_position
    `;

    const mysqlSql = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = :databaseName
        AND table_name = :tableName
      ORDER BY ordinal_position
    `;

    if (params.engine == null) {
      throw new Error("Database engine is not set in this profile.");
    }

    if (
      params.engine !== this.supportedEngines.postgresql &&
      params.engine !== this.supportedEngines.mysql
    ) {
      throw new Error(`Unsupported database engine: ${params.engine}`);
    }

    const sql = params.engine === this.supportedEngines.postgresql ? postgresSql : mysqlSql;

    const response = await client.send(
      new ExecuteStatementCommand({
        resourceArn: params.resourceArn,
        secretArn: params.secretArn,
        database: params.database,
        sql,
        parameters: [
          {
            name: "databaseName",
            value: { stringValue: params.database },
          },
          {
            name: "tableName",
            value: { stringValue: params.tableName },
          },
        ],
        includeResultMetadata: true,
      })
    );

    const columnMetadata = response.columnMetadata ?? [];

    return (response.records ?? []).map((record) => {
      const row = new Map<string, string>();

      for (const [index, metadata] of columnMetadata.entries()) {
        const value = record[index];
        const name = metadata?.name;

        if (name == null) {
          continue;
        }

        row.set(name.toLowerCase(), this.extractStringValue(value));
      }

      const columnName = row.get("column_name") ?? row.get("field") ?? "";
      const typeName = row.get("data_type") ?? row.get("type_name") ?? undefined;
      const nullable = row.get("is_nullable") === "YES";
      const defaultValue = row.get("column_default") || null;

      return {
        name: columnName,
        typeName,
        nullable,
        defaultValue,
      };
    });
  }

  async executeQuery(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    sql: string;
  }): Promise<ExecuteQueryData> {
    const credentials = await this.createCredentials(
      params.profileName,
      params.credentialsDirectory
    );

    const client = new RDSDataClient({
      region: params.region,
      credentials,
      endpoint: params.profileName === "ministack" ? "http://localhost:4566" : undefined,
    });

    const response = await client.send(
      new ExecuteStatementCommand({
        resourceArn: params.resourceArn,
        secretArn: params.secretArn,
        database: params.database,
        sql: params.sql,
        includeResultMetadata: true,
      })
    );

    return {
      columns: (response.columnMetadata ?? []).map((column, index) => ({
        name: column.name ?? `column_${index + 1}`,
        typeName: column.typeName,
        type: column.type,
        nullable: column.nullable,
      })),
      records: (response.records ?? []).map((record) =>
        record.map((field) => this.toSerializableValue(field))
      ),
      numberOfRecordsUpdated: response.numberOfRecordsUpdated,
    };
  }

  private toSerializableValue(
    field: {
      isNull?: boolean;
      stringValue?: string;
      longValue?: number;
      doubleValue?: number;
      booleanValue?: boolean;
      blobValue?: Uint8Array;
      arrayValue?: unknown;
    } | null
  ): ExecuteQueryValue {
    if (field == null) {
      return "";
    }

    if (field.isNull === true) {
      return null;
    }

    if (field.stringValue != null) {
      return field.stringValue;
    }

    if (field.longValue != null) {
      return field.longValue;
    }

    if (field.doubleValue != null) {
      return field.doubleValue;
    }

    if (field.booleanValue != null) {
      return field.booleanValue;
    }

    if (field.blobValue != null) {
      return Buffer.from(field.blobValue).toString("base64");
    }

    if (field.arrayValue != null && typeof field.arrayValue === "object") {
      const arrayValueRecord = field.arrayValue as Record<string, unknown>;

      if (this.isStringArray(arrayValueRecord.stringValues)) {
        return arrayValueRecord.stringValues;
      }

      if (this.isNumberArray(arrayValueRecord.longValues)) {
        return arrayValueRecord.longValues;
      }

      if (this.isNumberArray(arrayValueRecord.doubleValues)) {
        return arrayValueRecord.doubleValues;
      }

      if (this.isBooleanArray(arrayValueRecord.booleanValues)) {
        return arrayValueRecord.booleanValues;
      }

      if (Array.isArray(arrayValueRecord.arrayValues)) {
        return arrayValueRecord.arrayValues.map((nested) => this.toNestedArrayValue(nested));
      }
    }

    return "";
  }

  private toNestedArrayValue(value: unknown): ExecuteQueryValue {
    if (value == null || typeof value !== "object") {
      return "";
    }

    const valueRecord = value as Record<string, unknown>;

    if (this.isStringArray(valueRecord.stringValues)) {
      return valueRecord.stringValues;
    }

    if (this.isNumberArray(valueRecord.longValues)) {
      return valueRecord.longValues;
    }

    if (this.isNumberArray(valueRecord.doubleValues)) {
      return valueRecord.doubleValues;
    }

    if (this.isBooleanArray(valueRecord.booleanValues)) {
      return valueRecord.booleanValues;
    }

    return "";
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
  }

  private isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((item) => typeof item === "number");
  }

  private isBooleanArray(value: unknown): value is boolean[] {
    return Array.isArray(value) && value.every((item) => typeof item === "boolean");
  }

  private normalizeEngine(rawEngine: string | undefined): "postgresql" | "mysql" | undefined {
    if (rawEngine == null) {
      return undefined;
    }

    if (rawEngine.includes("postgres")) {
      return this.supportedEngines.postgresql;
    }

    if (rawEngine.includes("mysql")) {
      return this.supportedEngines.mysql;
    }

    return undefined;
  }

  private extractStringValue(
    field:
      | {
          isNull?: boolean;
          stringValue?: string;
          blobValue?: Uint8Array;
        }
      | null
      | undefined
  ): string {
    if (field == null || field.isNull === true) {
      return "";
    }

    if (field.stringValue != null) {
      return field.stringValue;
    }

    if (field.blobValue != null) {
      return new TextDecoder().decode(field.blobValue);
    }

    return "";
  }

  private extractTableNames(
    records: Array<Array<{ stringValue?: string; blobValue?: Uint8Array }>> | undefined
  ): string[] {
    if (records == null) {
      return [];
    }

    const names = records
      .map((record) => {
        const first = record[0];
        if (first?.stringValue != null) {
          return first.stringValue;
        }

        if (first?.blobValue != null) {
          return new TextDecoder().decode(first.blobValue);
        }

        return "";
      })
      .filter((name) => name.length > 0);

    return [...new Set(names)].sort((left, right) => left.localeCompare(right));
  }

  private async createCredentials(
    profileName: string,
    credentialsDirectory?: string
  ): Promise<{ accessKeyId: string; secretAccessKey: string }> {
    if (credentialsDirectory != null && credentialsDirectory.trim().length > 0) {
      const trimmedCredentialsDirectory = credentialsDirectory.trim();
      await assertAwsCredentialsDirectoryReadable(trimmedCredentialsDirectory);

      try {
        return await fromIni({
          profile: profileName,
          filepath: path.join(trimmedCredentialsDirectory, "credentials"),
          configFilepath: path.join(trimmedCredentialsDirectory, "config"),
        })();
      } catch (error) {
        throw toAwsCredentialsNotReadableError(error);
      }
    }

    try {
      return await fromIni({ profile: profileName })();
    } catch (error) {
      throw toAwsCredentialsNotReadableError(error);
    }
  }
}
