import type { DbCluster } from "../../domain/entities/DbCluster";
import type { DbClusterRepository } from "../../domain/repositories/DbClusterRepository";

export class ListDbClustersUseCase {
  constructor(private readonly repository: DbClusterRepository) {}

  async execute(params: {
    profileName: string;
    region: string;
    credentialsDirectory?: string;
  }): Promise<DbCluster[]> {
    const clusters = await this.repository.listDataApiEnabledClusters(params);

    return [...clusters].sort((left, right) => left.identifier.localeCompare(right.identifier));
  }
}
