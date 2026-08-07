# Quiver - プロジェクト概要

## 概要

Quiver（矢筒）は、RDS Data API を使用して Amazon RDS Aurora (MySQL/PostgreSQL) にクエリを実行するデスクトップDBクライアントアプリケーションです。

従来のDBクライアントとは異なり、データベースへの直接接続を行わず、RDS Data API を介してクエリを実行します。1回ずつ処理を実行する様子を「矢」に例え、それを管理する「矢筒（Quiver）」という名前を持ちます。

## 対象プラットフォーム

- Windows
- macOS

## 主な機能

### AWS 認証情報管理

- `~/.aws` の認証情報・設定ファイルの読み取り
- AWS SSO 設定の読み取り
- Profile による認証情報の切り替え

### RDS Aurora アクセス情報管理

- 複数の接続情報を管理（リージョン、Secrets Manager シークレット ARN、DB名など）
- 疎通テスト機能

### データベース操作

- MySQL / PostgreSQL 両対応
- テーブル一覧の取得・表示
- テーブルごとの列情報取得・表示
- クエリ実行・結果表示
- クエリ保存・履歴管理

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| 言語 | TypeScript |
| デスクトップフレームワーク | Electron |
| UI フレームワーク | React.js |
| CSS | LismCSS |
| Linter/Formatter | Biome |
| テスト用 AWS エンドポイント | MiniStack |
| 開発環境 | Docker / Dev Container |

## アーキテクチャ

```
┌─────────────────────────────────┐
│       Renderer Process          │
│  React.js + LismCSS (UI)       │
├─────────────────────────────────┤
│       Main Process              │
│  AWS SDK / RDS Data API Client  │
│  AWS Credential Reader          │
│  Query/Connection Storage       │
└──────────────┬──────────────────┘
               │ HTTPS (RDS Data API)
               ▼
┌─────────────────────────────────┐
│  Amazon RDS Aurora (MySQL/PG)   │
└─────────────────────────────────┘
```
