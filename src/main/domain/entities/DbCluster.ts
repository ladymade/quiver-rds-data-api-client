export type DbCluster = {
  clusterArn: string;
  identifier: string;
  endpoint?: string;
  engine: "postgresql" | "mysql";
};
