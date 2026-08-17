# Edit Profile Screen

## 目的

Edit Profile は既存の接続プロファイルを更新する画面です。

既存プロファイルの一覧から1件を選択し、AWS credential、リージョン、cluster ARN、secret ARN、database、engine を修正して保存できます。

## 画面の責務

- 既存 profile の読み込み
- profile の変更入力
- cluster の再解決
- profile の更新
- profile の削除

## ルーティング状態

この画面は `App` の `currentView === "editProfile"` で表示されます。

## 画面フロー

1. Query Editor から既存 profile を選択
2. `Edit Profile` に遷移する
3. 現在の値がフォームへ初期化される
4. 値を修正する
5. `Save Profile` を押す
6. profile の更新と再読込を行う

## 更新時の挙動

- 更新対象の profile 名は `previousName` として保持される
- 新しい cluster ARN が現在の利用可能 cluster に存在するか確認する
- cluster が見つからない場合はエラーとして扱う
- 更新成功後、profile 一覧を再読み込みして Query Editor に戻る

## 削除操作

Edit Profile では削除ボタンを利用でき、確認ダイアログを表示してから `deleteConnectionProfile` を呼び出します。

## IPC 連携

- `listConnectionProfiles`
- `listDbClusters`
- `updateConnectionProfile`
- `deleteConnectionProfile`

## 実装ファイル

- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/renderer/components/NewProfileForm.tsx](../src/renderer/components/NewProfileForm.tsx)
- [src/main/interfaces/ipc/connectionProfileIpcHandler.ts](../src/main/interfaces/ipc/connectionProfileIpcHandler.ts)
