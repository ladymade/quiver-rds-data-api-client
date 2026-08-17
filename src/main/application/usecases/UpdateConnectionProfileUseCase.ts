import type { ConnectionProfile } from "../../domain/entities/ConnectionProfile";
import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository";

export class UpdateConnectionProfileUseCase {
  constructor(private readonly repository: ConnectionProfileRepository) {}

  async execute(previousName: string, profile: ConnectionProfile): Promise<void> {
    const existingProfiles = await this.repository.list();
    const targetIndex = existingProfiles.findIndex((item) => item.name === previousName);

    if (targetIndex === -1) {
      throw new Error(`Profile "${previousName}" was not found.`);
    }

    if (profile.name !== previousName) {
      const nameTaken = existingProfiles.some((item) => item.name === profile.name);
      if (nameTaken) {
        throw new Error(`Profile name "${profile.name}" is already in use.`);
      }
    }

    const updatedProfiles = existingProfiles.map((item, index) =>
      index === targetIndex ? profile : item
    );

    await this.repository.replaceAll(updatedProfiles);
  }
}
