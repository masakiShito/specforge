# Phase2 完了条件（運用可能品質）

## Must（Phase2で完了）

1. **複数Document運用**
   - Document 追加（screen-spec / api-spec）
   - 追加直後の自動選択
   - Section 選択状態の Document ごとの保持

2. **api-spec 実用テンプレート**
   - Overview
   - Endpoint Basic Info
   - Request Parameters
   - Response Parameters
   - Error Responses
   - Processing Flow

3. **screen-spec ↔ api-spec 参照**
   - API Connections で Project 内 api-spec を選択できる
   - 内部参照は ID ベース
   - title 変更後も参照が壊れない

4. **validation 運用性**
   - 共通チェック（必須・重複・空行）
   - screen-spec 個別ルール
   - api-spec 個別ルール
   - document間参照ルール
   - message/reason/fix 形式の統一

5. **Guide / docs 同期**
   - kind 別 Guide（screen-spec / api-spec）
   - user-guide が現行実装と一致

## Should（Phase2で対応できれば望ましい）

- Document title 重複を運用上わかりやすく扱う
- API名（表示名）と参照IDの差異を validation で補助
- endpoint + method 重複を project 観点で検知

## Phase3 に送るもの

- number / reference の汎用入力 UI
- Document 削除 / 並び替え
- 永続化（API/DB）
- export / import
- Project 全体品質スコア
- ER / business-rule の本格運用
