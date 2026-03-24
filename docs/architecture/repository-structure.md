# Repository Structure

## monorepo を採用する理由
SpecForge は UI、API、設計書スキーマ、編集エンジン、品質ルールを分離しつつ、密接に連携させる必要がある。
monorepo により以下を実現する。

- 依存関係を明示したまま、責務ごとの独立開発を進められる
- 仕様変更時に apps と packages を同時に一貫更新できる
- turbo / pnpm workspace により、再利用パッケージの差分ビルドと高速開発を実現できる

## ディレクトリ責務

### apps/
- `apps/web`: 設計書編集 UI。フォーム入力、構造ツリー、警告可視化、将来のプレビューを担う
- `apps/api`: 保存、バリデーション、将来の AI 連携、出力処理を担う

### packages/
- `packages/ui`: Web と将来の他フロントエンドで再利用する UI 部品
- `packages/document-schema`: 設計書の構造・型・制約の定義
- `packages/editor-engine`: Markdown 非依存の内部ドキュメントモデル、変換、正規化
- `packages/lint-rules`: 設計品質ルール（必須項目、参照整合、命名規約など）

### docs/
- `docs/product`: プロダクト思想・価値・対象課題を記述
- `docs/architecture`: 構成方針、依存ルール、実装原則を記述

### infra/
- `infra/docker`: ローカル開発・将来の検証環境向けインフラ定義の置き場

## なぜこの構成が SpecForge に適しているか
SpecForge の中核は「文書編集 UI」ではなく、「設計書の構造と品質制御」である。
そのため、UI と API を apps に閉じ込め、ドメイン中核を packages 側へ分離する構成を採用する。

この分離により、将来的に UI が変わっても document-schema / editor-engine / lint-rules は継続利用できる。
結果として、出力フォーマットやクライアント実装に依存しない設計資産基盤を維持できる。
