# Contributing to Quiver

Thanks for your interest in contributing to Quiver.

This project is a desktop client for Amazon Aurora using the AWS RDS Data API. The codebase is intentionally structured around a clean layering approach and should remain easy to reason about.

## Development setup

```bash
npm install
npm run dev
```

## Project conventions

- TypeScript strict mode is expected
- avoid `any` unless it is truly unavoidable
- prefer `async` / `await` over promise chains
- keep AWS SDK access in the infrastructure layer
- keep the renderer focused on UI concerns only
- use the shared IPC types for main/renderer communication

## Branch workflow

- use feature branches for changes
- keep pull requests focused on one topic
- prefer small, easy-to-review diffs
- do not add secret material, local credentials, or environment-specific files to the repo

## Pull request checklist

Before opening a PR:

- run `npm run lint`
- run `npm run build`
- verify relevant tests or smoke checks still pass
- make sure the change is consistent with the current architecture
- include a concise summary of why the change is needed

## Reporting issues

Please include:

- the issue description
- affected OS / platform
- reproduction steps
- expected vs actual behavior
- relevant AWS config or connection details only if they are safe to share

## Security

Do not share secrets or credentials in issues, pull requests, or commit messages. For security concerns, please follow the reporting instructions in [SECURITY.md](SECURITY.md).
