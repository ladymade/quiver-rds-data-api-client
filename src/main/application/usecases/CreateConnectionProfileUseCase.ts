import type { ConnectionProfile } from "../../domain/entities/ConnectionProfile";
import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository";

export class CreateConnectionProfileUseCase {
  constructor(private readonly repository: ConnectionProfileRepository) {}

  async execute(profile: ConnectionProfile): Promise<void> {
    const exists = await this.repository.existsByName(profile.name);
    if (exists) {
      throw new Error(`Profile name "${profile.name}" is already in use.`);
    }
    await this.repository.save(profile);
  }
}
