# Releasing Quiver

This document describes the release workflow for maintainers. The commands below are defined in `package.json` and should be run from the repository root.

## Before a release

1. Confirm that the version in `package.json` is the intended release version.
2. Update `CHANGELOG.md` with the user-visible changes and release date.
3. Review the README and screen specifications against the current implementation.
4. Confirm that no credentials, tokens, local paths, or generated release artifacts are included in the change.

## Validation

Run the checks that apply to the change:

```bash
npm install
npm run lint
npm run format
npm run build
npm run verify:dist
```

For changes affecting the application workflow, run the MiniStack smoke test:

```bash
npm run ministack:up
npm run ministack:init
npm run test:e2e:smoke
npm run ministack:down
```

Run the broader projects when appropriate:

```bash
npm run test:e2e:ministack
npm run test:e2e:failure
```

If a test environment cannot be used, record that limitation in the release notes or pull request.

## Build installers

Build the package for the target platform. Every packaging script builds and verifies the application before invoking Electron Builder.

```bash
npm run package:linux
npm run package:mac
npm run package:win
```

The generic command is also available:

```bash
npm run package
```

Artifacts are written to `release/`. The configured targets are Linux x64 AppImage, Windows x64 NSIS, and macOS DMG for x64 and arm64.

Packaging may require platform-specific native build tools. The Windows command runs `check:win-env`; macOS builds may require Apple signing or local security approval even though signing is not currently configured in this repository.

## Tag and publish

After validation and packaging:

1. Review `git diff` and `git diff --check`.
2. Commit the release changes using the project commit conventions.
3. Create an annotated tag from the version in `package.json`:

   ```bash
   npm run release:tag
   ```

4. Push the commit and tag to GitHub.
5. Create a GitHub Release for the tag and attach the relevant files from `release/`.
6. Copy the corresponding `CHANGELOG.md` notes into the GitHub Release description.

The current installers are unsigned and Quiver does not provide automatic updates. Mention both limitations in the GitHub Release description until those capabilities are implemented.

## Post-release checks

- Confirm that each published artifact can be downloaded from GitHub Releases.
- Confirm that the artifact names and platform descriptions match the README.
- Open the application from each available artifact and verify the Info screen reports the intended version.
- Update the default release links or documentation if the distribution process changes.