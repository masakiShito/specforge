# Docs Index

SpecForge の設計思想と実装方針を明文化するドキュメント群です。

## 構成
- `product/vision.md`
  - なぜ SpecForge が必要か、どの課題を解決するか、どの世界観を目指すか
- `product/quality-principles.md`
  - 設計書品質をどのように定義し、運用で担保するか
- `product/user-guide.md`
  - 現行実装に基づく利用ガイド（Phase2）
- `product/phase2-completion.md`
  - Phase2 完了条件（Must / Should / Phase3）
- `architecture/repository-structure.md`
  - monorepo 構成と各ディレクトリ責務
- `architecture/architecture-principles.md`
  - SpecForge の実装で守るべき分離原則と依存方針

## ドキュメント運用ルール
1. 実装前に思想・責務・制約を docs に先に書く
2. PR では仕様変更と docs 更新を同時に行う
3. UI 都合でドメインモデルを歪めない
4. Markdown は出力形式の一つとして扱い、内部モデルの正しさを優先する
