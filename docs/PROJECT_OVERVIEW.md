# Quiver - プロジェクト概要

## 概要

Quiver は、Amazon RDS Data API を利用して Aurora MySQL / PostgreSQL を操作するデスクトップ DB クライアントです。

現時点での実装では、AWS の認証情報選択、RDS Aurora の一覧取得、接続テスト、SQL 実行、テーブル/カラム確認、接続プロファイルの保存と編集までを統合的に扱えます。

## 対象プラットフォーム

- Windows
- Linux
- macOS（ビルドは対応）

## 実装済みの主要機能

### AWS 認証情報管理

- `~/.aws` もしくは任意のディレクトリからの credentials 読み取り
- profile 名とリージョンの選択
- 既存 profile の切り替えと再読込

### RDS 接続情報管理

- RDS Aurora クラスタ一覧の取得
- Data API 有効な cluster の確認
- connection profile の保存
- profile の更新・削除
- 接続テスト（`SELECT 1` を実行して疎通確認）

### データベース操作

- MySQL / PostgreSQL の engine 判定
- テーブル一覧取得
- カラム一覧取得
- SQL 実行と結果表示

## 現在の画面

- Create Profile
- Edit Profile
- Query Editor

画面別の詳細は次のドキュメントを参照してください。

- [CREATE_PROFILE_SCREEN.md](CREATE_PROFILE_SCREEN.md)
- [EDIT_PROFILE_SCREEN.md](EDIT_PROFILE_SCREEN.md)
- [QUERY_EDITOR_SCREEN.md](QUERY_EDITOR_SCREEN.md)

## アーキテクチャ

```text
┌──────────────────────────────────────┐
│ Renderer Process                     │
│ - React UI                           │
│ - Create Profile / Edit Profile      │
│ - Query Editor                       │
├──────────────────────────────────────┤
│ Preload                              │
│ - contextBridge / ipcRenderer        │
├──────────────────────────────────────┤
│ Main Process                         │
│ - IPC handlers                       │
│ - usecase orchestration              │
│ - local profile persistence          │
├──────────────────────────────────────┤
│ Infrastructure                       │
│ - AWS SDK client                     │
│ - Credential provider               │
│ - Storage repository                 │
├──────────────────────────────────────┤
│ Amazon RDS Aurora + RDS Data API     │
└──────────────────────────────────────┘
```

## 実装上の重要な方針

- AWS SDK の実行は Main Process と infrastructure 層に閉じ込める
- Renderer から AWS 認証情報や secret を直接扱わない
- `shared/types/ipc.ts` を中心に、Main/Renderer の API を型安全に定義する
- クリーンアーキテクチャを維持し、依存方向を制御する

## 開発と検証

- 開発時は Vite + Electron の watch モードを利用する
- `npm run build` でビルドを確認する
- `npm run lint` で Biome の品質チェックを行う
- `npm run ministack:*` でローカル検証用インフラを起動する

## 今後の改善候補

- SQL 履歴の保存と再実行
- 接続エラー時のガイダンス強化
- AWS SSO 連携対応
- UI のアクセシビリティ改善
- テーブル/カラム表示の高度化
