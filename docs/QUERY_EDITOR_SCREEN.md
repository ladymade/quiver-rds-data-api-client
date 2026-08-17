# Query Editor Screen

## 目的

Query Editor は、選択中の接続プロファイルに対して SQL を実行し、結果とスキーマを確認できる画面です。

この画面の主な用途は次のとおりです。

- 接続プロファイルの切り替え
- テーブル一覧の閲覧
- カラム一覧の表示
- SQL の入力と実行
- 実行結果の表示

## 画面の責務

- profile の選択
- Schema Explorer の表示
- table と column の取得
- SQL エディタの表示
- クエリ実行結果の表示
- Create Profile / Edit Profile への遷移

## ルーティング状態

この画面は `App` の `currentView === "queryEditor"` で表示されます。

## 主要コンポーネント

### QueryEditorPage

- SQL エディタ
- ビュー分割レイアウト
- 実行結果表示
- table explorer

### QueryResults

- クエリの結果テーブルを表示する
- 行数やページ切り替えを扱う

### Schema Explorer

- database 名
- table 名
- 対応する column の一覧
- 開閉状態を持つ

## 画面フロー

1. `listConnectionProfiles` で保存済みプロファイルを読み込む
2. 初期の selected profile を決める
3. SQL エディタを表示する
4. table 一覧を取得して展開可能にする
5. table を開くと column 一覧を取得する
6. SQL を実行して query results を表示する

## IPC 連携

### 取得系

- `listConnectionProfiles`
- `listTables`
- `listTableColumns`

### 実行系

- `executeQuery`

## 実行時の挙動

- SQL を入力して `Run Query` を実行すると `executeQuery` が呼ばれる
- 成功時は `ExecuteQueryData` をテーブルとして表示する
- 失敗時は `ErrorDialog` を表示して詳細情報を出す
- table / column の取得中はローディング表示を出す

## 実装ファイル

- [src/renderer/components/QueryEditorPage.tsx](../src/renderer/components/QueryEditorPage.tsx)
- [src/renderer/components/QueryResults.tsx](../src/renderer/components/QueryResults.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/rdsIpcHandler.ts](../src/main/interfaces/ipc/rdsIpcHandler.ts)
- [src/shared/types/ipc.ts](../src/shared/types/ipc.ts)
