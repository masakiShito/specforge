# SpecForge

SpecForge は、単なる Markdown エディタではなく、
**設計書の品質と再現性を高めるためのプラットフォーム**です。

## 概要
多くの設計書運用は、執筆者の経験や記述スタイルに依存しやすく、
「書かれているが、再利用しづらい」「体裁は整っているが、設計として不十分」という問題を抱えます。

SpecForge は設計書を構造化データとして扱い、
品質ルールと整合性検査を通して、組織内の設計品質を安定化させます。

## コンセプト
- 自由度より一貫性を優先する
- 書きやすさより崩れにくさを優先する
- Markdown の制約に引っ張られない
- 設計書としての正しさを担保する
- 誰が書いても一定品質の設計書になることを目指す

## 目指すもの
- 執筆者依存の品質ばらつきを抑える
- 設計内容を機械可読な構造として保存する
- 必須項目不足・参照切れ・命名揺れなどを自動検出する
- 出力形式より先に、内部モデルの正しさを保証する

## 想定機能（将来）
- 構造化フォームによる設計書入力
- セクション／フィールド単位の妥当性検証
- 参照整合性チェックと品質警告表示
- 内部ドキュメントモデルから Markdown / HTML / PDF への出力
- API 経由での保存、検証、AI 補助提案

## Repository 構成

```text
specforge/
├── apps/
│   ├── web/                # 設計書編集 UI
│   └── api/                # 保存・検証・将来のAI連携API
├── packages/
│   ├── ui/                 # 共通UIコンポーネント
│   ├── document-schema/    # 設計書構造定義（型・制約）
│   ├── editor-engine/      # Markdown非依存の内部モデル
│   └── lint-rules/         # 設計書品質ルール
├── docs/
│   ├── product/            # ビジョン・思想
│   └── architecture/       # 構成方針・設計原則
└── infra/
    └── docker/             # インフラ定義の置き場
```

## 開発方針
1. apps と packages の責務を混ぜない
2. document-schema / editor-engine / lint-rules を中核として育てる
3. Markdown は出力形式の一つであり、内部表現の前提にしない
4. 汎用的すぎる `utils` / `common` の乱立を避ける
5. 仕様と思想を docs に明文化し、実装より先に整合性を取る

## セットアップ（初期）
```bash
pnpm install
pnpm dev
```

## ドキュメント
- Docs Index: `docs/README.md`
- Product Vision: `docs/product/vision.md`
- Product Quality Principles: `docs/product/quality-principles.md`
- Architecture Structure: `docs/architecture/repository-structure.md`
- Architecture Principles: `docs/architecture/architecture-principles.md`
