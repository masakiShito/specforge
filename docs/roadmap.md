# SpecForge 開発ロードマップ

**作成日**: 2026-05-18
**対象バージョン**: 0.1.0 → 1.0.0

---

## 目次

1. [現在の実装状況](#1-現在の実装状況)
2. [Phase 3: 基盤強化](#2-phase-3-基盤強化)
3. [Phase 4: 機能拡充](#3-phase-4-機能拡充)
4. [Phase 5: 運用品質向上](#4-phase-5-運用品質向上)
5. [長期ビジョン](#5-長期ビジョン)
6. [技術的負債](#6-技術的負債)
7. [優先度マトリクス](#7-優先度マトリクス)

---

## 1. 現在の実装状況

### 達成済み機能 (Phase 2 完了)

| 機能 | 状態 | 詳細 |
|------|------|------|
| Document Schema | ✅ 完了 | Project/Document/Section/Field 型定義 |
| 複数 Document 管理 | ✅ 完了 | 追加・選択・タイトル編集 |
| screen-spec テンプレート | ✅ 完了 | 6セクション、テーブル定義 |
| api-spec テンプレート | ✅ 完了 | 7セクション、エンドポイント定義 |
| Document 間参照 | ✅ 完了 | ID ベース参照、画面↔API連携 |
| Validation システム | ✅ 完了 | 765+ 行、20+ ルール |
| Quality Score | ✅ 完了 | 100点満点、ペナルティ計算 |
| Project Health Dashboard | ✅ 完了 | 全体品質可視化 |
| 設計書プレビュー | ✅ 完了 | Markdown レンダリング |

### 未実装パッケージ

| パッケージ | 状態 | 目的 |
|-----------|------|------|
| editor-engine | ❌ 骨組みのみ | Markdown 非依存の内部モデル |
| lint-rules | ❌ 骨組みのみ | 品質ルールの集約 |
| ui | ❌ 骨組みのみ | 再利用可能 UI コンポーネント |

---

## 2. Phase 3: 基盤強化

**期間**: 4-6 週間
**目標**: アーキテクチャ原則の実現、データ永続化

### 2.1 lint-rules パッケージの実装 [優先度: 最高]

**背景**:
現在、Validation ルールが `apps/web/lib/validation/` に実装されており、API から再利用できない。Architecture Principle #4 違反。

**タスク**:
```
packages/lint-rules/
├── src/
│   ├── index.ts
│   ├── types.ts                 # DesignValidationIssue, TableValidationContext
│   ├── rules/
│   │   ├── screen-fields.ts     # apps/web から移行
│   │   ├── events.ts
│   │   ├── messages.ts
│   │   ├── api-connections.ts
│   │   ├── api-spec-endpoint.ts
│   │   ├── api-spec-tables.ts
│   │   ├── reference-integrity.ts
│   │   └── common.ts
│   └── validators/
│       ├── document-validator.ts
│       └── project-validator.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**完了条件**:
- [ ] 既存ルールを packages/lint-rules に移行
- [ ] apps/web が packages/lint-rules を依存として使用
- [ ] apps/api から同一ルールを呼び出し可能
- [ ] 全ルールのテストカバレッジ 80%+

---

### 2.2 API バックエンド永続化 [優先度: 最高]

**背景**:
現在の API はプレースホルダのみ。データ永続化機能なし。

**タスク**:

```python
# 追加ファイル
apps/api/
├── app/
│   ├── database.py          # SQLAlchemy セットアップ
│   ├── models/
│   │   ├── __init__.py
│   │   ├── project.py       # Project ORM モデル
│   │   └── document.py      # Document ORM モデル
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── project_repository.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── project_service.py
│   │   └── validation_service.py   # lint-rules 呼び出し
│   └── routers/
│       ├── __init__.py
│       └── projects.py      # /api/v1/projects ルーター
├── alembic/                 # マイグレーション
│   ├── versions/
│   └── env.py
└── alembic.ini
```

**API エンドポイント**:
| メソッド | パス | 説明 |
|---------|------|------|
| POST | /api/v1/projects | プロジェクト作成 |
| GET | /api/v1/projects | プロジェクト一覧取得 |
| GET | /api/v1/projects/{id} | プロジェクト取得 |
| PUT | /api/v1/projects/{id} | プロジェクト更新 |
| DELETE | /api/v1/projects/{id} | プロジェクト削除 |
| POST | /api/v1/projects/{id}/validate | 検証実行 |
| POST | /api/v1/projects/{id}/documents | Document 追加 |
| PUT | /api/v1/documents/{id} | Document 更新 |
| DELETE | /api/v1/documents/{id} | Document 削除 |

**依存追加**:
```
sqlalchemy==2.0.0
alembic==1.13.0
asyncpg==0.29.0  # PostgreSQL async driver
```

**完了条件**:
- [ ] PostgreSQL 接続実装
- [ ] CRUD エンドポイント動作
- [ ] Alembic マイグレーション設定
- [ ] API テスト追加

---

### 2.3 Document 削除・並び替え UI [優先度: 高]

**背景**:
Document の追加・編集は可能だが、削除と並び替えの UI がない。

**タスク**:
```typescript
// apps/web/components/document-list.tsx に追加

// 1. 削除機能
- 削除ボタン追加
- 確認ダイアログ
- 状態更新ロジック

// 2. 並び替え機能
- ドラッグ&ドロップ
- 上下ボタン
- 状態更新ロジック
```

**完了条件**:
- [ ] Document 削除ボタンと確認ダイアログ
- [ ] Document 並び替え（D&D または ボタン）
- [ ] 削除時の参照チェック警告

---

## 3. Phase 4: 機能拡充

**期間**: 6-8 週間
**目標**: 入力 UI 完成、Export 機能

### 3.1 Number / Reference ValueType UI [優先度: 高]

**背景**:
Field.valueType に "number" と "reference" があるが、UI renderer では未対応。

**タスク**:
```typescript
// apps/web/components/field-renderer.tsx

// Number 入力
if (field.valueType === "number") {
  return (
    <input
      type="number"
      min={field.min}
      max={field.max}
      step={field.step}
      value={...}
      onChange={...}
    />
  );
}

// Reference 入力（Table 外）
if (field.valueType === "reference") {
  return (
    <ReferenceSelect
      reference={field.reference}
      current={value}
      onSelect={...}
    />
  );
}
```

**完了条件**:
- [ ] Number 入力フィールド実装（min/max/step 対応）
- [ ] Reference フィールドの一般入力 UI
- [ ] Table セル内での Reference 入力対応

---

### 3.2 Export / Import 機能 [優先度: 中]

**タスク**:
```typescript
// apps/web/lib/export/

// JSON Export
export function exportProjectToJson(project: Project, states: DocumentEditorState[]): string;

// Markdown Export
export function exportDocumentToMarkdown(doc: Document, state: DocumentEditorState): string;

// CSV Export (テーブルデータ)
export function exportTableToCsv(rows: TableRowValue[], columns: Field[]): string;

// JSON Import
export function importProjectFromJson(json: string): Result<Project, ImportError>;
```

**UI コンポーネント**:
```typescript
// apps/web/components/export/
├── ExportButton.tsx
├── ExportModal.tsx
├── ImportButton.tsx
└── ImportModal.tsx
```

**対応フォーマット**:
| フォーマット | Export | Import | 優先度 |
|------------|--------|--------|--------|
| JSON | ✅ | ✅ | 高 |
| Markdown | ✅ | ❌ | 中 |
| CSV | ✅ | ✅ | 中 |
| PDF | ✅ | ❌ | 低 |

**完了条件**:
- [ ] JSON Export/Import
- [ ] Markdown Export
- [ ] CSV Export (テーブル)
- [ ] Export ボタン UI

---

### 3.3 ER / Business Rule テンプレート [優先度: 中]

**背景**:
DocumentKind に "er-spec", "business-rule" があるが、テンプレート未実装。

**タスク**:
```typescript
// packages/document-schema/src/presets/

// ER 図仕様
export const erSpecPreset: Document = {
  kind: "er-spec",
  sections: [
    { key: "overview", title: "概要", ... },
    { key: "entities", title: "エンティティ一覧", ... },
    { key: "relationships", title: "リレーション一覧", ... },
    { key: "attributes", title: "属性詳細", ... },
  ],
};

// ビジネスルール
export const businessRulePreset: Document = {
  kind: "business-rule",
  sections: [
    { key: "overview", title: "概要", ... },
    { key: "conditions", title: "適用条件", ... },
    { key: "rules", title: "ルール定義", ... },
    { key: "exceptions", title: "例外事項", ... },
  ],
};
```

**完了条件**:
- [ ] er-spec プリセット定義
- [ ] business-rule プリセット定義
- [ ] 対応する Validation ルール
- [ ] Document 追加ダイアログに選択肢追加

---

## 4. Phase 5: 運用品質向上

**期間**: 4-6 週間
**目標**: テスト充実、パフォーマンス最適化

### 4.1 テスト充実化 [優先度: 高]

**現状**:
- テストファイル: 7 個
- カバレッジ: 推定 10-15%

**目標**:
- テストファイル: 30+ 個
- カバレッジ: 70%+

**タスク**:
```
# Validation ルールテスト (最重要)
packages/lint-rules/src/rules/__tests__/
├── screen-fields.test.ts      # 20+ テストケース
├── events.test.ts
├── messages.test.ts
├── api-connections.test.ts
├── api-spec-endpoint.test.ts
├── api-spec-tables.test.ts
└── reference-integrity.test.ts

# コンポーネントテスト
apps/web/components/__tests__/
├── document-editor.test.tsx
├── document-list.test.tsx
├── section-form.test.tsx
├── field-renderer.test.tsx
└── TableFieldEditor.test.tsx

# E2E テスト
apps/web/e2e/
├── document-crud.spec.ts
├── validation-flow.spec.ts
└── export-import.spec.ts
```

**完了条件**:
- [ ] Validation ルール 100% テストカバレッジ
- [ ] 主要コンポーネントのテスト
- [ ] E2E テスト（Playwright）セットアップ

---

### 4.2 パフォーマンス最適化 [優先度: 中]

**課題**:
1. 大規模 Document での再レンダリング
2. Table 行数が多い場合のパフォーマンス
3. Validation の重複計算

**タスク**:
```typescript
// 1. Table 仮想化
// apps/web/components/field/TableFieldEditor.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

// 2. Validation メモ化
// apps/web/hooks/useDocumentEditor.ts
const validationCache = useMemo(() => new Map(), []);

// 3. 状態更新の最適化
// Immer による immutable 更新
import { produce } from "immer";
```

**完了条件**:
- [ ] 500+ 行テーブルでのスムーズな動作
- [ ] Validation 結果のキャッシング
- [ ] React DevTools で不要な再レンダリングがないことを確認

---

### 4.3 認証・認可 [優先度: 中]

**タスク**:
```python
# apps/api/app/auth/
├── __init__.py
├── jwt.py           # JWT トークン生成・検証
├── dependencies.py  # FastAPI dependencies
└── models.py        # User モデル

# エンドポイント
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

**完了条件**:
- [ ] JWT 認証実装
- [ ] User モデルと登録/ログイン
- [ ] Project へのアクセス制御
- [ ] フロントエンドでの認証フロー

---

## 5. 長期ビジョン

### 5.1 editor-engine 実装 [優先度: 低]

**目的**: Markdown 非依存の内部ドキュメントモデル

```typescript
packages/editor-engine/
├── src/
│   ├── ast/
│   │   ├── nodes.ts         # AST ノード定義
│   │   └── builder.ts       # AST 構築
│   ├── normalizer/
│   │   └── normalizer.ts    # 正規化処理
│   ├── transformer/
│   │   ├── markdown.ts      # → Markdown 変換
│   │   ├── html.ts          # → HTML 変換
│   │   └── pdf.ts           # → PDF 変換
│   └── serializer/
│       └── json.ts          # JSON シリアライズ
```

**メリット**:
- 出力フォーマットの統一的な管理
- UI と出力ロジックの分離
- 将来的なエディタ拡張の基盤

---

### 5.2 UI パッケージ抽出 [優先度: 低]

**目的**: 再利用可能な UI コンポーネント

```typescript
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Table/
│   │   ├── Modal/
│   │   └── Badge/
│   ├── hooks/
│   │   └── useTheme.ts
│   └── styles/
│       └── tokens.ts
```

**メリット**:
- 他フロントエンド（モバイル等）での再利用
- デザインシステムの一元管理
- Storybook によるドキュメント

---

### 5.3 コラボレーション機能 [優先度: 低]

**将来検討**:
- リアルタイム同時編集（WebSocket / CRDT）
- コメント・レビュー機能
- 変更履歴・バージョン管理
- 通知・メンション

---

## 6. 技術的負債

### 6.1 インラインスタイルの移行 [優先度: 中]

**現状**: 大量の CSSProperties インラインスタイル

**推奨**: CSS Modules または Tailwind CSS

```typescript
// Before
<div style={{ padding: "16px", backgroundColor: "#FFFFFF", ... }}>

// After (CSS Modules)
<div className={styles.card}>

// After (Tailwind)
<div className="p-4 bg-white rounded-lg">
```

**対象ファイル**:
- document-editor.tsx (615+ 行)
- ProjectHealthDashboard.tsx (300+ 行)
- TableFieldEditor.tsx (250+ 行)

---

### 6.2 コンポーネント分割 [優先度: 中]

**現状**: DocumentEditor が 615+ 行、複数責務

**推奨**: カスタムフック + プレゼンテーショナルコンポーネント

```typescript
// hooks/useDocumentEditor.ts (作成済み)
// 状態管理・ハンドラをフックに抽出

// components/document-editor/
├── DocumentEditorContainer.tsx   # ロジック統合
├── DocumentEditorLayout.tsx      # レイアウト
├── DocumentEditorHeader.tsx      # ヘッダー部分
└── DocumentEditorPanels.tsx      # 3ペイン構成
```

---

### 6.3 定数のさらなる集約 [優先度: 低]

**現状**: constants/validation.ts, design-tokens.ts 作成済み

**残タスク**:
- 各コンポーネントのマジックナンバー抽出
- 重複定義の統合
- 型安全な定数アクセス

---

## 7. 優先度マトリクス

### 影響度 × 実装コスト

```
高影響度
    │
    │  ┌─────────────────────┐  ┌─────────────────────┐
    │  │ lint-rules 分離     │  │ API 永続化          │
    │  │ [Phase 3]           │  │ [Phase 3]           │
    │  │ 影響: 高, コスト: 中 │  │ 影響: 高, コスト: 高 │
    │  └─────────────────────┘  └─────────────────────┘
    │
    │  ┌─────────────────────┐  ┌─────────────────────┐
    │  │ Document 削除/並替  │  │ Number/Reference UI │
    │  │ [Phase 3]           │  │ [Phase 4]           │
    │  │ 影響: 中, コスト: 小 │  │ 影響: 中, コスト: 中 │
    │  └─────────────────────┘  └─────────────────────┘
    │
    │  ┌─────────────────────┐  ┌─────────────────────┐
    │  │ テスト充実化        │  │ Export/Import       │
    │  │ [Phase 5]           │  │ [Phase 4]           │
    │  │ 影響: 中, コスト: 中 │  │ 影響: 中, コスト: 中 │
    │  └─────────────────────┘  └─────────────────────┘
    │
低影響度 ─────────────────────────────────────────────── 高コスト
              低コスト
```

### 実装順序推奨

| 順序 | タスク | Phase | 理由 |
|------|--------|-------|------|
| 1 | lint-rules 分離 | 3 | アーキテクチャ原則実現 |
| 2 | API 永続化 | 3 | データ保存必須 |
| 3 | Document 削除/並替 | 3 | 運用ワークフロー完成 |
| 4 | Number/Reference UI | 4 | 入力機能完成 |
| 5 | テスト充実化 | 5 | 品質保証 |
| 6 | Export/Import | 4 | データ連携 |
| 7 | 認証・認可 | 5 | マルチユーザー対応 |
| 8 | パフォーマンス最適化 | 5 | スケーラビリティ |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-05-18 | 初版作成 |

---

*このロードマップは開発状況に応じて更新されます。*
