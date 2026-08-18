# Quiver

A faster way to work with Aurora databases without repeated login friction, SSH hopping, or direct DB exposure.

Quiver is a desktop database client for Amazon Aurora built around the AWS RDS Data API. It helps you connect to Aurora MySQL and PostgreSQL through AWS-native authentication and keep your database access simple, repeatable, and safer.

## Why this project exists

If you work with AWS-hosted databases, the usual flow is painful:

- you keep switching between AWS profiles and regions
- you waste time re-entering credentials or cluster details
- you rely on browser-based tooling or ad-hoc scripts
- you need to manage direct database access in environments where that is not ideal or even allowed

Quiver reduces that friction.

With Quiver, you can:

- open a saved profile and get straight to work
- avoid repeated login and credential entry across sessions
- connect to Aurora through AWS-native APIs instead of opening direct DB sockets
- keep secrets out of browser-layer code and UI state
- work in a focused desktop workflow built for database tasks

## What Quiver solves

- no repeated manual login flow for every session
- no need to expose a direct database endpoint in your daily workflow
- reduced operational overhead when using AWS profiles and Aurora clusters
- a consistent desktop workflow for connection setup, schema inspection, and query execution

## Core features

- AWS profile discovery and selection
- AWS credentials directory support
- Aurora cluster lookup and connection testing
- saved connection profile create / update / delete
- table and column metadata inspection
- SQL execution via the RDS Data API
- desktop-based profile switching and query workflow

## Screens

- Create Profile
- Edit Profile
- Query Editor

For implementation details and UI specs, see:

- [docs/CREATE_PROFILE_SCREEN.md](docs/CREATE_PROFILE_SCREEN.md)
- [docs/EDIT_PROFILE_SCREEN.md](docs/EDIT_PROFILE_SCREEN.md)
- [docs/QUERY_EDITOR_SCREEN.md](docs/QUERY_EDITOR_SCREEN.md)

## How it works

Quiver uses the AWS SDK and RDS Data API instead of opening a raw database connection. It is designed for cataloging AWS-safe database access in a desktop workflow while keeping the app logic cleanly separated.

The app structure is intentionally layered:

- Main process: AWS SDK calls, local persistence, IPC handlers
- Preload: safe bridge to the renderer process
- Renderer: React-based desktop UI only
- Shared: typed IPC contracts between processes

## Tech stack

- Electron
- React + TypeScript
- Vite
- Tailwind CSS
- AWS SDK v3
- Biome
- Docker Compose / MiniStack

## Project structure

```text
quiver/
├── src/
│   ├── main/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── index.ts
│   ├── preload/
│   ├── renderer/
│   ├── shared/
│   └── ...
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── CREATE_PROFILE_SCREEN.md
│   ├── EDIT_PROFILE_SCREEN.md
│   └── QUERY_EDITOR_SCREEN.md
├── docker/
├── scripts/
├── build/
├── e2e/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── vite.config.ts
├── biome.json
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── .gitignore
```

## Requirements

- Node.js 20 LTS or later
- npm
- AWS account with access to Aurora and RDS Data API
- valid AWS credentials or named AWS profiles

## Installation

Download the latest installer from the [GitHub Releases](https://github.com/ladymade/quiver-rds-data-api-client/releases) page.

- Windows: download the `.exe` installer
- macOS: download the `.dmg` installer
- Linux: download the `.AppImage` and make it executable before launching

The v0.1.0 release is an early release. Installers are currently unsigned, and automatic updates are not included. Your operating system may show a security warning when launching an installer; verify the download source before continuing.

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app in development mode

```bash
npm run dev
```

### 3) Build the project

```bash
npm run build
```

### 4) Run lint checks

```bash
npm run lint
```

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
npm run package
npm run package:linux
npm run package:mac
npm run package:win
npm run ministack:up
npm run ministack:init
npm run ministack:down
npm run ministack:logs
npm run ministack:reset
```

## Local testing with MiniStack

For local development and validation, the project supports MiniStack as a substitute for AWS RDS Data API endpoints.

```bash
npm run ministack:up
npm run ministack:init
```

When the profile name is `ministack`, the app will use the local MiniStack endpoint instead of the AWS production endpoint.

## Packaging installers

The project is configured for Electron Builder packaging:

```bash
npm run build
npm run package
```

Platform-specific packaging:

```bash
npm run package:linux
npm run package:mac
npm run package:win
```

Outputs are generated under the `release` directory.

## Important constraints

- no direct database TCP connection is used
- AWS credentials and secrets are never exposed to the renderer process
- AWS SDK usage is isolated to the infrastructure layer
- IPC is typed and kept explicit between main and renderer
- the app is designed for desktop use, not browser-only operation

## Why this is useful for daily AWS work

This app is meant to reduce repetitive AWS database work:

- reuse a saved connection profile instead of re-entering cluster information every time
- stop constantly switching between AWS tools and ad hoc SQL shells
- keep AWS authentication centralized and profile-based
- make quick Aurora checks part of a normal developer workflow

## Roadmap

Planned improvements include:

- query history and re-execution
- richer schema visualization
- better error guidance for failed connections
- stronger AWS profile / SSO support
- improved logging and troubleshooting tools

## Contributing

Contributions are welcome.

Before submitting changes:

- open or update an issue for significant work
- keep the project architecture consistent with the clean-layer design
- keep AWS/RDS logic inside the infrastructure layer
- prefer small, reviewable pull requests

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## Security

Please do not commit credentials or secrets. For vulnerability reporting, see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Related docs

- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- [docs/CREATE_PROFILE_SCREEN.md](docs/CREATE_PROFILE_SCREEN.md)
- [docs/EDIT_PROFILE_SCREEN.md](docs/EDIT_PROFILE_SCREEN.md)
- [docs/QUERY_EDITOR_SCREEN.md](docs/QUERY_EDITOR_SCREEN.md)
