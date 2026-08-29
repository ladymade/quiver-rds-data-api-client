# Create Profile Screen

## Purpose

Create Profile is the screen for creating a new connection profile for the RDS Data API.

This screen collects the following information:

- AWS credential profile name
- AWS region
- AWS credentials directory
- Aurora cluster ARN
- Secrets Manager secret ARN
- Database name
- Engine type

## Responsibilities

- Enter a new connection profile
- Select an AWS credential profile
- Select a database cluster or enter the ARN manually
- Run a connection test
- Save the profile

## Routing State

This screen is displayed when `currentView === "newProfile"` in `App`.

## Main Inputs

### Profile Name

- A user-defined profile identifier
- Should be a name that is easy for the user to manage
- Must not duplicate an existing profile name

### AWS Credential Profile

- Select an AWS CLI profile name
- Options are loaded from `~/.aws`
- If `credentialsDirectory` is specified, that directory is used instead
- If the `credentials` / `config` files in the specified directory cannot be read, the form displays a credentials read error

### AWS Region

- The region used for RDS and Secrets Manager
- The region associated with the selected AWS profile may be filled in automatically

### Cluster ARN

- Select or enter the Aurora cluster ARN
- Options can be selected from the `listDbClusters` result
- Manual entry is available when no cluster is found

### Secret ARN

- The Secrets Manager secret ARN used by the Data API
- Stores the credentials required for the database connection

### Database

- The database name to connect to
- Supports both MySQL and PostgreSQL

### Engine

- `postgresql` or `mysql`
- Inferred from the cluster, but can also be preserved from manual input

## Flow

1. Load AWS credentials.
2. Select an AWS profile and region.
3. Select a cluster or enter an ARN.
4. Enter the secret ARN and database name.
5. Run Test Connection.
6. Run Create Profile after the connection succeeds.

## Validation

Create Profile is enabled when all of the following conditions are met:

- Profile name is entered
- Credential profile is entered
- Region is entered
- Cluster ARN is entered
- Secret ARN is entered
- Database is entered

## IPC Integration

### Read Operations

- `listAwsCredentialProfiles`
- `listAwsCredentialProfilesFromDirectory`
- `listDbClusters`

### Execute Operations

- `testConnection`
- `createConnectionProfile`

## UI Behavior

- The profile must be saved before navigating to the query editor screen on the right.
- The `Test Connection` result is displayed as a message.
- Success or failure messages are displayed when saving.
- `ErrorDialog` is used for errors.
- If the credential files cannot be accessed, a user-facing credentials read error is displayed instead of the raw AWS SDK error.

## Implementation Files

- [src/renderer/components/NewProfileForm.tsx](../src/renderer/components/NewProfileForm.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/connectionProfileIpcHandler.ts](../src/main/interfaces/ipc/connectionProfileIpcHandler.ts)
- [src/shared/types/ipc.ts](../src/shared/types/ipc.ts)
