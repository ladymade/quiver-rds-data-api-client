# Changelog

All notable changes to Quiver are documented in this file.

## [0.3.0] - 2026-08-30

### Added

- Keyboard shortcut for executing queries from the Query Editor
- Screenshots to the public README

### Changed

- Translated the public screen documentation into English
- Aligned the loading overlay with the application background

### Fixed

- Improved error handling for unreadable AWS credentials files

## [0.2.0] - 2026-08-19

### Added

- Settings screen with persisted language selection
- English, Japanese, and Simplified Chinese UI translations
- Info screen for application information
- Schema Explorer refresh for tables and columns
- Expanded desktop workflow for creating, editing, and deleting connection profiles

### Changed

- Updated public documentation with installation, first-time setup, development, testing, and packaging instructions
- Added OSS repository metadata and a release checklist

## [0.1.0] - 2026-08-18

### Added

- AWS profile discovery and profile selection
- Aurora cluster lookup and connection testing
- Saved connection profile creation, editing, and deletion
- Table and column metadata inspection
- SQL execution through the Amazon RDS Data API
- Desktop workflows for connection profiles and query editing
- Linux AppImage, Windows NSIS, and macOS DMG packaging workflows

### Notes

- Quiver supports Amazon Aurora MySQL and PostgreSQL through the RDS Data API.
- Installers are unsigned in this early release.
- Automatic updates are not included; download future versions from GitHub Releases.
