import type { Settings } from "../../domain/entities/Settings";
import type { SettingsRepository } from "../../domain/repositories/SettingsRepository";

export class GetSettingsUseCase {
  constructor(private readonly repository: SettingsRepository) {}

  async execute(): Promise<Settings> {
    return this.repository.get();
  }
}
