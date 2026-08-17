export type ConnectionProfile = {
  name: string;
  credentialProfileName: string;
  region: string;
  credentialsDirectory: string | null;
  clusterArn: string;
  secretArn: string;
  database: string;
  engine?: "postgresql" | "mysql";
};
