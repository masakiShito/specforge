# Architecture Principles

## 目的
SpecForge を長期的に拡張可能な「設計品質プラットフォーム」として維持するための実装原則を定義する。

## 原則

### 1. ドメイン中核を packages に固定する
- 中核は `document-schema` / `editor-engine` / `lint-rules`
- `apps/web` と `apps/api` は中核を利用するクライアント層

### 2. 依存方向を一方向に保つ
- `apps/*` -> `packages/*` は許可
- `packages/*` -> `apps/*` は禁止
- `packages/ui` は表示ロジックに限定し、ドメイン判断を持たない

### 3. Markdown 非依存を維持する
- editor-engine は Markdown AST を唯一の表現として採用しない
- 内部モデルから各出力形式へ変換する方針を守る

### 4. 品質検証を API 前提で実行可能にする
- lint は UI 実装に依存させない
- `apps/api` から同一ルールを利用できる設計にする

### 5. 命名に責務を埋め込む
- `utils` / `common` / `misc` の新設は原則禁止
- 新規パッケージは「何を保証するか」が名前から読めること

## 変更管理
- 原則変更は docs 更新を必須とする
- 原則に反する実装を入れる場合は、理由と撤去条件を PR に記載する
