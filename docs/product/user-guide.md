# SpecForge 使い方ガイド（Phase2 現行実装）

最終更新: 2026-03-25

## 1. このツールの位置づけ

SpecForge は、設計書を自由記述ではなく **構造化データ** として編集・検証するツールです。

- 「何を書くか」をスキーマで固定し、抜け漏れを減らす
- Document 間参照（screen-spec ↔ api-spec）を ID ベースで管理する
- 品質警告（validation）を編集導線に組み込む

## 2. 現在の実装状況（実装ベース）

### 実装済み

- 複数 Document の表示・切替
- Document 追加（screen-spec / api-spec）
- Document タイトル編集（表示名）
- 3ペイン編集（Document/Section/Validation）
- table 入力（行追加・削除、セル入力）
- API Connections から Project 内 api-spec 参照選択
- 参照整合性チェック（未設定・参照切れ・kind不一致など）
- API仕様書向け validation（endpoint / httpMethod / summary / テーブル妥当性）
- kind別 Guide（screen-spec / api-spec）

### 未対応（Phase3 送り）

- number / reference の汎用 valueType 入力UI
- Document 削除 / 並び替え
- 永続化（DB 保存）
- export / import
- Project 全体品質スコア

## 3. 画面の見方

### 左ペイン

- Project 名、Document 一覧（kind バッジ付き）
- Document 追加
- 現在 Document の title 編集
- Section 一覧とステータス/警告件数

### 中央ペイン

- 選択 Section のフォーム入力
- table 型は列定義に基づくグリッド入力

### 右ペイン

- Validation（error / warning / info）
- JSON プレビュー
- kind 別 Guide
- Quality Score

## 4. Document 運用ルール（推奨）

- 1 screen-spec = 1画面
- 1 api-spec = 1API
- screen-spec の API Connections で参照先 api-spec を必ず選ぶ
- タイトルは表示名。参照整合は targetDocumentId（内部ID）を正とする

## 5. valueType 対応状況

### 対応済み

- text
- textarea
- boolean
- enum
- table

### 未対応

- number（未対応プレースホルダ表示）
- reference（未対応プレースホルダ表示）

## 6. Validation の見方

- **error**: 放置すると設計書として不成立になりやすい問題
- **warning**: 運用上の曖昧さ・不足の兆候
- **info**: 品質改善のヒント

Validation 項目をクリックすると、該当 Section / Field へ移動できます。

## 7. screen-spec ↔ api-spec 参照

API Connections の `targetDocumentId` は、Project 内 api-spec の内部 ID を保持します。

- title 変更後も参照は壊れません（IDベースのため）
- API名（表示名）と参照IDは分離して扱います
- 参照未設定 / 参照切れ / kind不一致は validation に反映されます

## 8. 現在の制約

- データはブラウザメモリ上で管理（リロードで初期化）
- 参照候補は同一 Project 内の api-spec のみ
- スキーマ自体の動的編集は未提供

## 9. Phase2 完了の判断基準

詳細は `docs/product/phase2-completion.md` を参照してください。
