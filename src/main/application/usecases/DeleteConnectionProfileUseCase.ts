import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository";

export class DeleteConnectionProfileUseCase {
  constructor(private readonly repository: ConnectionProfileRepository) {}

  async execute(name: string): Promise<void> {
    const profiles = await this.repository.list();
    const nextProfiles = profiles.filter((profile) => profile.name !== name);

    if (nextProfiles.length === profiles.length) {
      throw new Error(`Profile "${name}" was not found.`);
    }

    await this.repository.replaceAll(nextProfiles);
  }
}
