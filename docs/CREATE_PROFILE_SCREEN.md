# Create Profile Screen

## 目的

Create Profile は、RDS Data API を利用するための接続プロファイルを新規作成する画面です。

この画面では、次の情報を収集します。

- AWS 認証プロファイル名
- AWS リージョン
- AWS credentials ディレクトリ
- Aurora cluster ARN
- Secrets Manager secret ARN
- データベース名
- エンジン種別

## 画面の責務

- 新しい接続プロファイルの入力
- AWS credential profile の選択
- データベースの cluster 選択または ARN 手入力
- 接続テストの実行
- プロファイルの保存

## ルーティング状態

この画面は `App` の `currentView === "newProfile"` で表示されます。

## 主な入力項目

### Profile Name

- 任意のプロファイル識別名
- ユーザーが管理しやすい名称を指定する
- 既存の profile 名と重複してはいけない

### AWS Credential Profile

- AWS CLI の profile 名を選択する
- `~/.aws` から候補が読み込まれる
- `credentialsDirectory` を指定した場合はそのディレクトリを参照する

### AWS Region

- RDS と Secrets Manager を利用するリージョン
- 選択した AWS profile に対応するリージョンが自動補完されることがある

### Cluster ARN

- Aurora cluster の ARN を選択または入力する
- `listDbClusters` の結果から候補を選択できる
- cluster が見つからない場合は手入力モードが使われる

### Secret ARN

- Data API が利用する Secrets Manager からのシークレット ARN
- DB 接続に必要な認証情報を管理する

### Database

- 接続するデータベース名
- MySQL / PostgreSQL どちらでも利用可能

### Engine

- `postgresql` または `mysql`
- cluster から推定されるが、手入力でも保持可能

## 操作フロー

1. AWS credentials を読み込む
2. AWS profile と region を選択する
3. cluster を選択または ARN を入力する
4. secret ARN と database を入力する
5. Test Connection を実行する
6. 接続が成功したら Create Profile を実行する

## バリデーション

Create Profile で有効な条件は、以下を満たすことです。

- profile name が入力済み
- credential profile が入力済み
- region が入力済み
- cluster ARN が入力済み
- secret ARN が入力済み
- database が入力済み

## IPC 連携

### 読み込み

- `listAwsCredentialProfiles`
- `listAwsCredentialProfilesFromDirectory`
- `listDbClusters`

### 実行

- `testConnection`
- `createConnectionProfile`

## UI の想定

- 右側の query editor 画面へ遷移する前に profile を保存する
- `Test Connection` の結果をメッセージで表示する
- 保存時に成功・失敗メッセージを表示する
- エラー時には `ErrorDialog` を利用する

## 実装ファイル

- [src/renderer/components/NewProfileForm.tsx](../src/renderer/components/NewProfileForm.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/connectionProfileIpcHandler.ts](../src/main/interfaces/ipc/connectionProfileIpcHandler.ts)
- [src/shared/types/ipc.ts](../src/shared/types/ipc.ts)
