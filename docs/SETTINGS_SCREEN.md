# Settings Screen

## Purpose

Settings is the screen for managing application-wide settings. Currently, it only provides language settings.

## Responsibilities

- Display current settings
- Change and save settings

## Routing State

This screen is displayed when `currentView === "settings"` in `App`. Users navigate to it from the gear icon in the global menu on the left sidebar.

## Main Inputs / Components

### Language Selection

- Language selection dropdown. Users can choose English (`en`), Japanese (`ja`), or Simplified Chinese (`zh-CN`).
- Allowed languages are managed consistently by the `AppLanguage` type (`src/shared/types/ipc.ts`) and the main process `SaveSettingsUseCase`.

### Save Settings Button

- Saves the current form values. While saving, the button is disabled and its label changes to `Saving...`.

## Flow

1. When the screen is displayed, fetch the current settings with `getSettings` and apply them to the form.
2. The user changes the language.
3. Pressing `Save Settings` calls `saveSettings`. On success, the entire UI switches immediately to the selected language. On failure, the current display language is preserved and an error dialog is displayed.
4. On renderer startup, fetch the saved language with `getSettings` before initializing i18n. If the settings cannot be fetched, the app starts in English.

## Validation / Update Behavior

- `language` only allows `"en"`, `"ja"`, or `"zh-CN"` and is validated by the main process `SaveSettingsUseCase`.

## IPC Integration

### Read Operations

- `settings:get`

### Execute Operations

- `settings:save`

## Implementation Files

- [src/renderer/components/SettingsPage.tsx](../src/renderer/components/SettingsPage.tsx)
- [src/renderer/i18n.ts](../src/renderer/i18n.ts)
- [src/renderer/locales/](../src/renderer/locales/)
- [src/renderer/components/AppSidebar.tsx](../src/renderer/components/AppSidebar.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/settingsIpcHandler.ts](../src/main/interfaces/ipc/settingsIpcHandler.ts)
- [src/main/application/usecases/GetSettingsUseCase.ts](../src/main/application/usecases/GetSettingsUseCase.ts)
- [src/main/application/usecases/SaveSettingsUseCase.ts](../src/main/application/usecases/SaveSettingsUseCase.ts)
- [src/main/infrastructure/storage/SettingsRepository.ts](../src/main/infrastructure/storage/SettingsRepository.ts)
- [src/main/domain/repositories/SettingsRepository.ts](../src/main/domain/repositories/SettingsRepository.ts)
- [src/main/domain/entities/Settings.ts](../src/main/domain/entities/Settings.ts)
