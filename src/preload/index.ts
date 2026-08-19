import { contextBridge, ipcRenderer } from "electron";
import { type AppLanguage, IPC_CHANNELS } from "../shared/types/ipc";

contextBridge.exposeInMainWorld("quiverApi", {
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  listAwsCredentialProfiles: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_AWS_CREDENTIAL_PROFILES),
  listAwsCredentialProfilesFromDirectory: (directoryPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_AWS_CREDENTIAL_PROFILES_FROM_DIRECTORY, directoryPath),
  selectAwsCredentialsDirectory: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_AWS_CREDENTIALS_DIRECTORY),
  logUnexpectedError: (payload: {
    source: string;
    message: string;
    stack?: string;
    metadata?: string;
  }) => ipcRenderer.invoke(IPC_CHANNELS.LOG_UNEXPECTED_ERROR, payload),
  listDbClusters: (params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
  }) => ipcRenderer.invoke(IPC_CHANNELS.LIST_DB_CLUSTERS, params),
  testConnection: (params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
  }) => ipcRenderer.invoke(IPC_CHANNELS.TEST_CONNECTION, params),
  listTables: (params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    engine?: "postgresql" | "mysql";
  }) => ipcRenderer.invoke(IPC_CHANNELS.LIST_TABLES, params),
  listTableColumns: (params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    tableName: string;
    engine?: "postgresql" | "mysql";
  }) => ipcRenderer.invoke(IPC_CHANNELS.LIST_TABLE_COLUMNS, params),
  executeQuery: (params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    sql: string;
  }) => ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_QUERY, params),
  listConnectionProfiles: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_CONNECTION_PROFILES),
  createConnectionProfile: (profile: {
    name: string;
    credentialProfileName: string;
    region: string;
    credentialsDirectory: string | null;
    clusterArn: string;
    secretArn: string;
    database: string;
    engine?: "postgresql" | "mysql";
  }) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_CONNECTION_PROFILE, profile),
  updateConnectionProfile: (params: {
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
  }) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CONNECTION_PROFILE, params),
  deleteConnectionProfile: (name: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_CONNECTION_PROFILE, name),
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  saveSettings: (settings: { language: AppLanguage }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),
});
