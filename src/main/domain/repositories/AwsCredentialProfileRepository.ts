import type { AwsCredentialProfile } from "../entities/AwsCredentialProfile";

export interface AwsCredentialProfileRepository {
  listProfiles(directoryPath?: string): Promise<AwsCredentialProfile[]>;
}
