# Quiver

Quiver is a desktop database client for Amazon Aurora databases that uses the AWS RDS Data API instead of opening a direct TCP connection.

It is designed for teams and developers who want a lightweight desktop tool to:

- browse AWS credential profiles
- discover Aurora clusters and databases
- validate a connection before executing SQL
- inspect schemas and table metadata
- run SQL queries through the RDS Data API
- manage saved connection profiles locally

This project is intentionally opinionated: it does not connect directly to the database over the network. All access goes through AWS SDK calls and the RDS Data API layer.

## Why Quiver?

Most database GUI tools assume a direct DB socket is available. In AWS environments, that is often not possible or desirable.

Quiver is built for the AWS-native workflow:

- use AWS credentials or named profiles
- target Aurora MySQL or PostgreSQL clusters
- execute SQL via RDS Data API
- keep secrets out of the renderer process
- work from a desktop client without exposing DB credentials to the browser layer

## Features

- AWS profile discovery and selection
- AWS credentials directory switching
- Aurora cluster listing
- connection validation
- saved connection profile create / update / delete
- table and column metadata inspection
- query execution and result rendering
- desktop UI for profile switching and query editing

## Screens

- Create Profile
- Edit Profile
- Query Editor

For implementation details and UI specs, see:

- [docs/CREATE_PROFILE_SCREEN.md](docs/CREATE_PROFILE_SCREEN.md)
- [docs/EDIT_PROFILE_SCREEN.md](docs/EDIT_PROFILE_SCREEN.md)
- [docs/QUERY_EDITOR_SCREEN.md](docs/QUERY_EDITOR_SCREEN.md)

## How it works

Quiver follows a clean layered architecture:

- Main process: AWS SDK calls, IPC handlers, local persistence
- Preload: safe bridge for renderer access
- Renderer: React-based desktop UI only
- Shared: typed IPC contracts between main and renderer

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
└── .gitignore
```

## Requirements

- Node.js 20 LTS or later
- npm
- AWS account with access to Aurora and RDS Data API
- valid AWS credentials or named profiles

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app in development mode

```bash
npm run dev
```

### 3) Build the app

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

### Linux/macOS/Windows targets

The app can be packaged with Electron Builder:

```bash
npm run build
npm run package
```

For Windows-specific packaging:

```bash
npm run build
npm run check:win-env
npm run package:win
```

Outputs are generated under the `release` directory.

## Important constraints

- no direct database TCP connection is used
- AWS credentials and secrets are never exposed to the renderer process
- AWS SDK usage is isolated to the infrastructure layer
- IPC is typed and kept explicit between main and renderer
- the app is designed for desktop use, not browser-only operation

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

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Related docs

- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- [docs/CREATE_PROFILE_SCREEN.md](docs/CREATE_PROFILE_SCREEN.md)
- [docs/EDIT_PROFILE_SCREEN.md](docs/EDIT_PROFILE_SCREEN.md)
- [docs/QUERY_EDITOR_SCREEN.md](docs/QUERY_EDITOR_SCREEN.md)
