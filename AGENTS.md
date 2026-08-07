# AGENTS.md

このファイルは GitHub Copilot の AI Agent がこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

Quiver は RDS Data API を用いた Aurora MySQL/PostgreSQL 向けデスクトップ DB クライアントです。Electron + React + TypeScript で構築されています。

## ディレクトリ構成

クリーンアーキテクチャに基づいた構成を採用しています。

```
quiver/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── domain/             # ドメイン層
│   │   │   ├── entities/      # エンティティ（Connection, Query, Table 等）
│   │   │   └── repositories/  # リポジトリインターフェース
│   │   ├── application/        # アプリケーション層
│   │   │   └── usecases/      # ユースケース（ExecuteQuery, ListTables 等）
│   │   ├── infrastructure/     # インフラストラクチャ層
│   │   │   ├── aws/           # AWS SDK 実装（RDS Data API, Credentials）
│   │   │   └── storage/       # ローカルストレージ実装（接続情報・クエリ保存）
│   │   ├── interfaces/         # インターフェースアダプター層
│   │   │   └── ipc/           # IPC ハンドラ（Renderer との通信）
│   │   └── index.ts           # Main Process エントリポイント
│   ├── renderer/               # Electron Renderer Process
│   │   ├── components/        # React コンポーネント
│   │   ├── hooks/             # カスタムフック
│   │   ├── pages/             # ページコンポーネント
│   │   └── styles/            # LismCSS スタイル
│   ├── shared/                 # Main/Renderer 共有型定義
│   │   └── types/             # IPC チャネル型、共通型
│   └── preload/               # Preload スクリプト
├── .devcontainer/              # Dev Container 設定
├── docs/                       # ドキュメント
├── biome.json                  # Biome 設定
├── electron-builder.yml
├── package.json
└── tsconfig.json
```

### レイヤーの依存ルール

- **domain** → 外部依存なし。純粋な TypeScript のみ
- **application** → domain のみに依存
- **infrastructure** → domain, application に依存（リポジトリインターフェースの実装）
- **interfaces** → application に依存（ユースケースの呼び出し）

## コーディング規約

- 言語: TypeScript（strict モード）
- Linter/Formatter: Biome を使用。`npx biome check --apply .` でフォーマット&リント修正
- コミットメッセージ: Conventional Commits に従う（`feat:`, `fix:`, `docs:`, `chore:` など）
- コード内コメントは英語で記述する

## 開発コマンド

```bash
# 依存インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント & フォーマット
npx biome check --apply .
```

## Copilot Agent への指示

### 実装時の注意事項

- クリーンアーキテクチャのレイヤー依存ルールを厳守すること
- Electron の Main Process と Renderer Process の責務を明確に分離すること
- AWS SDK の呼び出しは必ず infrastructure 層で行う
- IPC 通信には型安全なチャネル定義（shared/types）を使用する
- エラーハンドリングは丁寧に行い、ユーザーに分かりやすいメッセージを返す
- 機密情報（AWS credentials）を Renderer Process に露出させない
- ビジネスロジックは domain / application 層に集約し、infrastructure に漏らさない

### PR / コード変更時

- Biome によるリント・フォーマットチェックをパスすること
- クリーンアーキテクチャの依存方向に違反していないか確認すること

### UI 実装時

- LismCSS を活用し、一貫したデザインを維持する
- アクセシビリティに配慮する
- レスポンシブデザインは不要（デスクトップ専用）
