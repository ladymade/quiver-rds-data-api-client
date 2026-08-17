import type { DbClusterRepository } from "../../domain/repositories/DbClusterRepository";

export class TestConnectionUseCase {
  constructor(private readonly repository: DbClusterRepository) {}

  async execute(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
    resourceArn: string;
    secretArn: string;
    database: string;
  }): Promise<void> {
    await this.repository.testDataApiConnection(params);
  }
}
