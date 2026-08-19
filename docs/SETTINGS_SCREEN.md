# Settings Screen

## 目的

アプリケーション全体の設定を管理する画面。現在は言語設定のみを提供する。

## 画面の責務

- 現在の設定値の表示
- 設定値の変更と保存

## ルーティング状態

この画面は `App` の `currentView === "settings"` で表示されます。グローバルメニュー(左サイドバー)の歯車アイコンから遷移します。

## 主な入力項目 / 主要コンポーネント

### Language Selection

- 言語選択のドロップダウン。現在は `English` (`en`) のみ選択可能。
- 将来的に他言語を追加する場合は `AppLanguage` 型 (`src/shared/types/ipc.ts`) にリテラルを追加する。

### Save Settings ボタン

- 現在のフォーム内容を保存する。保存中はボタンを無効化しラベルを `Saving...` に変更する。

## 操作フロー

1. 画面表示時に `getSettings` で現在の設定を取得し、フォームに反映する。
2. ユーザーが言語を変更する。
3. `Save Settings` を押下すると `saveSettings` を呼び出し、成功時は完了、失敗時はエラーダイアログを表示する。

## バリデーション / 更新時の挙動

- `language` は `"en"` 以外を許可しない(Main 側の `SaveSettingsUseCase` でバリデーション)。

## IPC 連携

### 取得系

- `settings:get`

### 実行系

- `settings:save`

## 実装ファイル

- [src/renderer/components/SettingsPage.tsx](../src/renderer/components/SettingsPage.tsx)
- [src/renderer/components/AppSidebar.tsx](../src/renderer/components/AppSidebar.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/settingsIpcHandler.ts](../src/main/interfaces/ipc/settingsIpcHandler.ts)
- [src/main/application/usecases/GetSettingsUseCase.ts](../src/main/application/usecases/GetSettingsUseCase.ts)
- [src/main/application/usecases/SaveSettingsUseCase.ts](../src/main/application/usecases/SaveSettingsUseCase.ts)
- [src/main/infrastructure/storage/SettingsRepository.ts](../src/main/infrastructure/storage/SettingsRepository.ts)
- [src/main/domain/repositories/SettingsRepository.ts](../src/main/domain/repositories/SettingsRepository.ts)
- [src/main/domain/entities/Settings.ts](../src/main/domain/entities/Settings.ts)
