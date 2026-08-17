import type { AwsCredentialProfile } from "../../domain/entities/AwsCredentialProfile";
import type { AwsCredentialProfileRepository } from "../../domain/repositories/AwsCredentialProfileRepository";

export class ListAwsCredentialProfilesUseCase {
  constructor(private readonly repository: AwsCredentialProfileRepository) {}

  async execute(directoryPath?: string): Promise<AwsCredentialProfile[]> {
    const profiles = await this.repository.listProfiles(directoryPath);

    return [...profiles].sort((left, right) => {
      if (left.name === "default") {
        return -1;
      }

      if (right.name === "default") {
        return 1;
      }

      return left.name.localeCompare(right.name);
    });
  }
}
