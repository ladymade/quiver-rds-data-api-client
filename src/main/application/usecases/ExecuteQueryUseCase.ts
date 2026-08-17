import type {
  DbClusterRepository,
  ExecuteQueryData,
} from "../../domain/repositories/DbClusterRepository";

export class ExecuteQueryUseCase {
  constructor(private readonly repository: DbClusterRepository) {}

  async execute(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
    sql: string;
  }): Promise<ExecuteQueryData> {
    if (params.sql.trim().length === 0) {
      throw new Error("SQL must not be empty.");
    }

    return this.repository.executeQuery(params);
  }
}
