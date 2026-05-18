# コードレビュー修正レポート

**修正日**: 2026-05-18
**対象**: code-review.md で指摘された改善項目

---

## 修正サマリー

| No. | 項目 | ステータス |
|-----|------|----------|
| 1 | テスト環境のセットアップ | 完了 |
| 2 | APIバックエンドの改善 | 完了 |
| 3 | カスタムフックへのロジック分離 | 完了 |
| 4 | 定数・スタイルの外部ファイル化 | 完了 |
| 5 | エラーハンドリングの改善 | 完了 |

---

## 1. テスト環境のセットアップ

### 変更ファイル

**packages/document-schema**
- `package.json` - Vitest追加
- `vitest.config.ts` - 新規作成
- `src/utils/normalize.test.ts` - 新規作成
- `src/utils/result.test.ts` - 新規作成
- `src/presets/screen-spec.test.ts` - 新規作成

**apps/web**
- `package.json` - Vitest, Testing Library追加
- `vitest.config.ts` - 新規作成
- `vitest.setup.ts` - 新規作成
- `lib/document-editor/validate-document.test.ts` - 新規作成
- `utils/qualityScore.test.ts` - 新規作成

**apps/api**
- `requirements.txt` - pytest, httpx追加
- `tests/__init__.py` - 新規作成
- `tests/test_main.py` - 新規作成

### テスト実行方法

```bash
# packages/document-schema
cd packages/document-schema && pnpm test

# apps/web
cd apps/web && pnpm test

# apps/api
cd apps/api && pytest
```

---

## 2. APIバックエンドの改善

### 変更ファイル
- `apps/api/app/main.py` - 全面改修

### 追加機能

1. **CORSミドルウェア**
   - localhost:3000 からのアクセスを許可
   - 環境変数 `CORS_ORIGINS` でカスタマイズ可能

2. **Pydanticモデル**
   - `HealthResponse`, `MessageResponse`
   - `ProjectData`, `DocumentData`, `SectionData`, `FieldValue`
   - `ValidationResult`, `ValidationIssue`
   - `ErrorResponse`

3. **APIエンドポイント**
   - `GET /` - ルートメッセージ
   - `GET /health` - ヘルスチェック
   - `POST /api/v1/projects/{project_id}/validate` - プロジェクト検証
   - `POST /api/v1/projects` - プロジェクト作成
   - `GET /api/v1/projects/{project_id}` - プロジェクト取得
   - `PUT /api/v1/projects/{project_id}` - プロジェクト更新
   - `DELETE /api/v1/projects/{project_id}` - プロジェクト削除

4. **設定管理**
   - `Settings` クラスで環境変数管理
   - `lifespan` ハンドラでスタートアップ/シャットダウン処理

---

## 3. カスタムフックへのロジック分離

### 変更ファイル
- `apps/web/hooks/useDocumentEditor.ts` - 新規作成

### 抽出したロジック

`DocumentEditor` コンポーネントから以下を `useDocumentEditor` フックに抽出:

```typescript
export function useDocumentEditor(options: UseDocumentEditorOptions = {}): UseDocumentEditorReturn {
  // 状態管理
  projectState, documentStates, selectedDocumentId, ...

  // バリデーション
  validation, designQuality, projectQuality, validationItems, ...

  // ハンドラ
  handleFieldValueChange, handleDocumentSelect, handleAddDocument, ...
}
```

### メリット
- コンポーネントの軽量化
- ロジックの再利用性向上
- テスタビリティ向上

---

## 4. 定数・スタイルの外部ファイル化

### 変更ファイル
- `apps/web/constants/design-tokens.ts` - 新規作成
- `apps/web/constants/validation.ts` - 新規作成
- `apps/web/utils/qualityScore.ts` - 定数参照に更新

### design-tokens.ts

```typescript
export const colors = {
  primary: { 50: "#EFF6FF", 500: "#3B82F6", ... },
  neutral: { 50: "#F8FAFC", 900: "#0F172A", ... },
  success: { ... },
  warning: { ... },
  error: { ... },
  documentKind: { ... },
};

export const spacing = { ... };
export const typography = { ... };
export const borderRadius = { ... };
export const shadows = { ... };
export const transitions = { ... };
export const zIndex = { ... };
```

### validation.ts

```typescript
export const QUALITY_SCORE_PENALTIES = {
  error: 20,
  warning: 5,
  info: 0,
};

export const QUALITY_SCORE_THRESHOLDS = {
  good: 90,
  caution: 70,
};

export const QUALITY_STATUS_LABELS = { ... };
export const QUALITY_STATUS_COLORS = { ... };
export const DOCUMENT_KIND_CONFIG = { ... };
export const REFERENCE_TYPE_CONFIG = { ... };
```

---

## 5. エラーハンドリングの改善

### 変更ファイル
- `packages/document-schema/src/utils/result.ts` - 新規作成
- `packages/document-schema/src/utils/normalize.ts` - 更新
- `packages/document-schema/src/index.ts` - エクスポート追加

### Result型の導入

```typescript
// Result型定義
export type Result<T, E> = Ok<T> | Err<E>;

// ユーティリティ関数
export function ok<T>(value: T): Ok<T>;
export function err<E>(error: E): Err<E>;
export function isOk<T, E>(result: Result<T, E>): result is Ok<T>;
export function isErr<T, E>(result: Result<T, E>): result is Err<E>;
export function unwrap<T, E>(result: Result<T, E>): T;
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T;
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>;
export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>;
```

### safeNormalizeProjectData

例外を投げずにResult型を返す安全版:

```typescript
export function safeNormalizeProjectData(
  input: unknown
): Result<Project, NormalizeError> {
  if (input === null) {
    return err({ code: "NULL_INPUT", message: "Input is null" });
  }
  // ...
}

// 使用例
const result = safeNormalizeProjectData(input);
if (result.ok) {
  const project = result.value;
} else {
  console.error(result.error.message);
}
```

---

## 新規作成ファイル一覧

```
packages/document-schema/
├── vitest.config.ts
└── src/utils/
    ├── result.ts
    ├── result.test.ts
    └── normalize.test.ts (テスト追加)
    └── screen-spec.test.ts

apps/web/
├── vitest.config.ts
├── vitest.setup.ts
├── constants/
│   ├── design-tokens.ts
│   └── validation.ts
├── hooks/
│   └── useDocumentEditor.ts
├── lib/document-editor/
│   └── validate-document.test.ts
└── utils/
    └── qualityScore.test.ts

apps/api/
├── tests/
│   ├── __init__.py
│   └── test_main.py
```

---

## 今後の推奨事項

1. **テストカバレッジの拡充**
   - コンポーネントテスト追加
   - E2Eテスト (Playwright) の導入

2. **CSSの完全移行**
   - インラインスタイルを design-tokens を使用したスタイルに段階的移行
   - CSS Modules または Tailwind CSS の検討

3. **カスタムフックの活用**
   - `useDocumentEditor` を `DocumentEditor` コンポーネントで使用
   - 他の大きなコンポーネントも同様にロジック分離

4. **データベース接続**
   - PostgreSQL 接続の実装
   - APIエンドポイントの永続化対応

---

*このレポートは2026-05-18時点の修正内容をまとめています。*
