import type { ConnectionProfile } from "../../domain/entities/ConnectionProfile";
import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository";

export class ListConnectionProfilesUseCase {
  constructor(private readonly repository: ConnectionProfileRepository) {}

  async execute(): Promise<ConnectionProfile[]> {
    return this.repository.list();
  }
}
