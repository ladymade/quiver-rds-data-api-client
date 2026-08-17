import type { ConnectionProfile } from "../entities/ConnectionProfile";

export interface ConnectionProfileRepository {
  list(): Promise<ConnectionProfile[]>;
  existsByName(name: string): Promise<boolean>;
  save(profile: ConnectionProfile): Promise<void>;
  replaceAll(profiles: ConnectionProfile[]): Promise<void>;
}
