// IPC channel names and shared types between Main and Renderer processes.
// All types here must be serializable (no class instances, no functions).

export const IPC_CHANNELS = {
  GET_APP_VERSION: "app:get-version",
  LIST_AWS_CREDENTIAL_PROFILES: "credentials:list-profiles",
  LIST_AWS_CREDENTIAL_PROFILES_FROM_DIRECTORY: "credentials:list-profiles-from-directory",
  SELECT_AWS_CREDENTIALS_DIRECTORY: "credentials:select-directory",
  LOG_UNEXPECTED_ERROR: "app:log-unexpected-error",
  LIST_DB_CLUSTERS: "rds:list-db-clusters",
  TEST_CONNECTION: "rds:test-connection",
  LIST_TABLES: "rds:list-tables",
  LIST_TABLE_COLUMNS: "rds:list-table-columns",
  EXECUTE_QUERY: "rds:execute-query",
  LIST_CONNECTION_PROFILES: "profiles:list",
  CREATE_CONNECTION_PROFILE: "profiles:create",
  UPDATE_CONNECTION_PROFILE: "profiles:update",
  DELETE_CONNECTION_PROFILE: "profiles:delete",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export type AwsCredentialProfileDto = {
  name: string;
  region?: string;
};

export type ListAwsCredentialProfilesResult = {
  profiles: AwsCredentialProfileDto[];
  sourceDirectory?: string;
  errorMessage?: string;
};

export type SelectAwsCredentialsDirectoryResult = {
  canceled: boolean;
  directoryPath?: string;
};

export type UnexpectedErrorLogPayload = {
  source: string;
  message: string;
  stack?: string;
  metadata?: string;
};

export type DbClusterDto = {
  clusterArn: string;
  identifier: string;
  endpoint?: string;
  engine: "postgresql" | "mysql";
};

export type ListDbClustersParams = {
  profileName: string;
  region: string;
  credentialsDirectory?: string;
};

export type ListDbClustersResult = {
  clusters: DbClusterDto[];
  error?: {
    message: string;
    details?: string;
  };
};

export type TestConnectionParams = {
  profileName: string;
  region: string;
  credentialsDirectory?: string;
  resourceArn: string;
  secretArn: string;
  database: string;
};

export type TestConnectionResult = {
  success: boolean;
  message: string;
  details?: string;
};

export type ListTablesParams = {
  profileName: string;
  region: string;
  credentialsDirectory?: string;
  resourceArn: string;
  secretArn: string;
  database: string;
  engine?: "postgresql" | "mysql";
};

export type ListTablesResult = {
  tables: string[];
  error?: {
    message: string;
    details?: string;
  };
};

export type TableColumnDto = {
  name: string;
  typeName?: string;
  nullable?: boolean;
  defaultValue?: string | null;
};

export type ListTableColumnsParams = {
  profileName: string;
  region: string;
  credentialsDirectory?: string;
  resourceArn: string;
  secretArn: string;
  database: string;
  tableName: string;
  engine?: "postgresql" | "mysql";
};

export type ListTableColumnsResult = {
  columns: TableColumnDto[];
  error?: {
    message: string;
    details?: string;
  };
};

export type ExecuteQueryParams = {
  profileName: string;
  region: string;
  credentialsDirectory?: string;
  resourceArn: string;
  secretArn: string;
  database: string;
  sql: string;
};

export type ExecuteQueryColumn = {
  name: string;
  typeName?: string;
  type?: number;
  nullable?: number;
};

export type ExecuteQueryValue = string | number | boolean | null | ExecuteQueryValue[];

export type ExecuteQueryData = {
  columns: ExecuteQueryColumn[];
  records: ExecuteQueryValue[][];
  numberOfRecordsUpdated?: number;
};

export type ExecuteQueryResult = {
  success: boolean;
  data?: ExecuteQueryData;
  error?: {
    message: string;
    details?: string;
  };
};

export type ConnectionProfileDto = {
  name: string;
  credentialProfileName: string;
  region: string;
  credentialsDirectory: string | null;
  clusterArn: string;
  secretArn: string;
  database: string;
  engine?: "postgresql" | "mysql";
};

export type ListConnectionProfilesResult = {
  profiles: ConnectionProfileDto[];
};

export type CreateConnectionProfileResult = {
  success: boolean;
  errorMessage?: string;
};

export type UpdateConnectionProfileResult = {
  success: boolean;
  errorMessage?: string;
};

export type DeleteConnectionProfileResult = {
  success: boolean;
  errorMessage?: string;
};

export type QuiverApi = {
  getAppVersion: () => Promise<string>;
  listAwsCredentialProfiles: () => Promise<ListAwsCredentialProfilesResult>;
  listAwsCredentialProfilesFromDirectory: (
    directoryPath: string
  ) => Promise<ListAwsCredentialProfilesResult>;
  selectAwsCredentialsDirectory: () => Promise<SelectAwsCredentialsDirectoryResult>;
  logUnexpectedError: (payload: UnexpectedErrorLogPayload) => Promise<void>;
  listDbClusters: (params: ListDbClustersParams) => Promise<ListDbClustersResult>;
  testConnection: (params: TestConnectionParams) => Promise<TestConnectionResult>;
  listTables: (params: ListTablesParams) => Promise<ListTablesResult>;
  listTableColumns: (params: ListTableColumnsParams) => Promise<ListTableColumnsResult>;
  executeQuery: (params: ExecuteQueryParams) => Promise<ExecuteQueryResult>;
  listConnectionProfiles: () => Promise<ListConnectionProfilesResult>;
  createConnectionProfile: (
    profile: ConnectionProfileDto
  ) => Promise<CreateConnectionProfileResult>;
  updateConnectionProfile: (params: {
    previousName: string;
    profile: ConnectionProfileDto;
  }) => Promise<UpdateConnectionProfileResult>;
  deleteConnectionProfile: (name: string) => Promise<DeleteConnectionProfileResult>;
};
