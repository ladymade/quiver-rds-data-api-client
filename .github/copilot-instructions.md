# Copilot Instructions

## プロジェクトコンテキスト

このリポジトリは **Quiver** - RDS Data API ベースのデスクトップ DB クライアントアプリです。

- フレームワーク: Electron + React + TypeScript
- CSS: LismCSS
- Linter: Biome
- 対象DB: Amazon RDS Aurora (MySQL, PostgreSQL)
- 接続方式: RDS Data API（直接DB接続は行わない）
- アーキテクチャ: クリーンアーキテクチャ

## コード生成時のルール

### 全般

- TypeScript strict モードに準拠する
- `any` 型の使用を避け、適切な型を定義する
- async/await を使用し、Promise チェーンは避ける
- エラーは適切にハンドリングし、握りつぶさない

### クリーンアーキテクチャ

- domain 層は外部ライブラリに依存しない純粋な TypeScript で記述する
- application 層の UseCase は domain 層のリポジトリインターフェースに依存する
- infrastructure 層でリポジトリインターフェースの具象実装を提供する
- 依存性注入により各層を疎結合に保つ

### Electron アーキテクチャ

- Main Process: AWS SDK 操作、ファイルシステムアクセス、IPC ハンドラ
- Renderer Process: UI（React）のみ。Node.js API への直接アクセスは禁止
- IPC 通信: `contextBridge` + `preload` スクリプトで型安全に行う

### React コンポーネント

- 関数コンポーネント + Hooks を使用
- Props には必ず型定義を付ける
- 状態管理は React の useState/useReducer を基本とする

### AWS SDK

- AWS SDK v3 を使用する
- `@aws-sdk/client-rds-data` を使用して RDS Data API を呼び出す
- 認証情報は `@aws-sdk/credential-providers` を活用する
- リージョン・認証情報はユーザーが設定した値を使用する
- AWS SDK の利用は infrastructure 層に閉じ込める

### スタイリング

- LismCSS のユーティリティを活用する
- インラインスタイルは避ける

## コミット・PR

- Conventional Commits 形式を使用
- PR 説明は日本語で記述可
