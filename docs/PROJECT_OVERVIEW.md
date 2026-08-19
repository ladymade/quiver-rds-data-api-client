# Quiver Project Overview

## Overview

Quiver is a desktop database client for Aurora MySQL and PostgreSQL through the Amazon RDS Data API.

The current implementation provides AWS credential profile selection, Aurora cluster discovery, connection testing, saved connection profiles, schema inspection, SQL execution, application settings, and app information.

## Supported platforms

- Windows x64
- Linux x64
- macOS x64 and arm64

## Implemented features

### AWS credentials

- Read credentials from `~/.aws` or a user-selected directory
- Select AWS profiles and regions
- Reload and switch between available profiles

### RDS connection profiles

- Discover Aurora clusters and select clusters with the Data API enabled
- Save, update, and delete connection profiles
- Test connections by executing `SELECT 1`

### Database operations

- Detect MySQL or PostgreSQL engines
- List tables and columns
- Execute SQL and display tabular results

## Current screens

- Create Profile
- Edit Profile
- Query Editor
- Settings
- Info

See the screen specifications for details:

- [Create Profile](CREATE_PROFILE_SCREEN.md)
- [Edit Profile](EDIT_PROFILE_SCREEN.md)
- [Query Editor](QUERY_EDITOR_SCREEN.md)
- [Settings](SETTINGS_SCREEN.md)

## Architecture

```text
┌──────────────────────────────────────┐
│ Renderer Process                     │
│ - React UI                           │
│ - Profile screens / Query Editor     │
│ - Settings / Info                    │
├──────────────────────────────────────┤
│ Preload                              │
│ - contextBridge / ipcRenderer        │
├──────────────────────────────────────┤
│ Main Process                         │
│ - IPC handlers                       │
│ - use case orchestration             │
│ - local profile/settings persistence │
├──────────────────────────────────────┤
│ Infrastructure                       │
│ - AWS SDK clients                    │
│ - Credential providers               │
│ - Storage repositories               │
├──────────────────────────────────────┤
│ Amazon RDS Aurora + RDS Data API     │
└──────────────────────────────────────┘
```

## Design rules

- AWS SDK calls stay in the Main Process and infrastructure layer.
- The renderer never accesses AWS credentials or secret values directly.
- Main/renderer APIs are defined through typed contracts in `src/shared/types/ipc.ts`.
- Clean architecture controls dependencies from outer layers toward inner interfaces.

## Development and validation

- Development uses Vite and Electron watch processes.
- `npm run build` compiles the main, preload, and renderer bundles.
- `npm run verify:dist` checks the required build artifacts.
- `npm run lint` and `npm run format` run Biome checks.
- `npm run ministack:*` manages local validation infrastructure.

## Future work

- Query history and re-execution
- Better connection error guidance
- Stronger AWS SSO support
- Accessibility improvements
- Richer table and column visualization
