# Quiver

Quiver は、Amazon RDS Data API を使用して Aurora MySQL / PostgreSQL を操作するデスクトップ DB クライアントです。

通常の DB クライアントと異なり、RDS へ直接 TCP 接続を行わず、AWS SDK 経由の RDS Data API を通じて接続・クエリ実行・テーブル確認を行います。

## 現在の実装状況

Quiver は現在、以下の主要機能を実装済みです。

- AWS 認証プロファイルの読み込み
- AWS credentials ディレクトリの切り替え
- RDS Aurora クラスタ一覧の取得
- 接続テスト（SELECT 1 の実行）
- 接続プロファイルの作成・更新・削除
- テーブル一覧とカラム一覧の取得
- SQL 実行と結果表示
- デスクトップ UI 上でのプロファイル切り替えと画面遷移

## 主要画面

- Create Profile
- Edit Profile
- Query Editor

画面ごとの詳細仕様は以下のドキュメントを参照してください。

- [docs/CREATE_PROFILE_SCREEN.md](docs/CREATE_PROFILE_SCREEN.md)
- [docs/EDIT_PROFILE_SCREEN.md](docs/EDIT_PROFILE_SCREEN.md)
- [docs/QUERY_EDITOR_SCREEN.md](docs/QUERY_EDITOR_SCREEN.md)

## 技術スタック

- Electron
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui 風の UI コンポーネント
- AWS SDK v3
- Biome
- Docker Compose / MiniStack

## アーキテクチャ

- Main Process
  - AWS SDK 呼び出し
  - local storage / userData への保存
  - IPC ハンドラの登録
- Preload
  - contextBridge を経由して Renderer に安全な API を公開
- Renderer Process
  - ユーザー操作 UI
  - DB 接続プロファイルの作成・編集・クエリ編集
- Shared
  - Main / Renderer 間で共有する IPC 型定義

## ディレクトリ構成

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
├── release/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── biome.json
└── README.md
```

## セットアップ

1. Node.js LTS を用意
2. 依存関係をインストール

```bash
npm install
```

3. 開発起動

```bash
npm run dev
```

## 利用可能なコマンド

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

## MiniStack を使う

ローカル開発では RDS Data API の代替として MiniStack を利用できます。

```bash
npm run ministack:up
npm run ministack:init
```

プロファイル名が `ministack` の場合、RDSClient / RDSDataClient はローカルエンドポイントを利用する実装になっています。

## Windows 向けパッケージ生成

Linux から Windows 向けのインストーラーを作成するには、以下の手順を実行します。

```bash
npm install
npm run build
npm run check:win-env
npm run package:win
```

生成物は `release` 配下に出力されます。

## 重要な設計上の制約

- 直接 DB 接続は行わない
- AWS 認証情報やシークレット情報は Renderer に露出しない
- AWS SDK の利用は infrastructure 層に閉じ込める
- IPC は Typed API を介して Main / Renderer 間で安全にやり取りする
- 画面はデスクトップ前提で設計する

## 今後の予定

- クエリ履歴の保存と再実行
- テーブル/カラムのより高度な表示
- 接続失敗時のガイダンス改善
- AWS SSO / profile 連携の強化
- エラー監視ログの改善と可視化

## ライセンス

MIT
