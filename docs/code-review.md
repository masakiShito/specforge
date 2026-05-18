# SpecForge コードレビューレポート

**レビュー日**: 2026-05-17
**対象**: プロジェクト全体のソースコード

---

## 1. エグゼクティブサマリー

SpecForgeは、設計書の品質と再現性を高めるためのスキーマ駆動型プラットフォームです。全体的にコード品質は高く、アーキテクチャ原則に沿った実装がなされています。

### 総合評価

| 観点 | 評価 | コメント |
|------|------|----------|
| アーキテクチャ | ★★★★☆ | 責務分離が明確、依存方向も適切 |
| コード品質 | ★★★★☆ | TypeScript活用、型安全性が高い |
| 保守性 | ★★★★☆ | モジュール分割が適切 |
| セキュリティ | ★★★☆☆ | 基本対策は実施、改善余地あり |
| パフォーマンス | ★★★☆☆ | 最適化の余地あり |
| テスト | ★★☆☆☆ | テストコードが未整備 |

---

## 2. アーキテクチャ評価

### 2.1 良い点

#### モノレポ構成の適切な活用
```
specforge/
├── apps/          # アプリケーション層
│   ├── web/       # Next.js フロントエンド
│   └── api/       # FastAPI バックエンド
└── packages/      # 共有パッケージ層
    └── document-schema/  # ドメインモデル
```

- **依存方向が一方向**: `apps/*` → `packages/*` の原則が守られている
- **ドメイン中核の分離**: `document-schema` パッケージにドメインロジックが集約
- **pnpm workspaces + Turbo**: モノレポ管理ツールの適切な選択

#### 型安全性の徹底
```typescript
// packages/document-schema/src/core/field.ts
export interface Field {
  id: string;
  key: string;
  label: string;
  required: boolean;
  valueType: FieldValueType;
  // ...
}
```

- TypeScript strict mode が有効
- 型ガード関数 (`isProject`, `isDocument`) による実行時検証
- 列挙型による制約 (`DocumentKind`, `FieldValueType`)

### 2.2 改善が必要な点

#### 未実装パッケージの存在
以下のパッケージは構造のみで実装が進んでいない:
- `packages/editor-engine`: Markdown非依存の内部モデル
- `packages/lint-rules`: 品質ルールの集約
- `packages/ui`: 再利用可能UIコンポーネント

**推奨**: Phase計画に沿って段階的に実装を進めるか、使用予定がない場合は削除を検討

#### APIバックエンドの最小実装
```python
# apps/api/app/main.py
@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "SpecForge API is running"}

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

現状はヘルスチェックのみ。データ永続化、検証APIの実装が必要。

---

## 3. コード品質評価

### 3.1 フロントエンド (apps/web)

#### 良い点

**1. コンポーネント設計**
- 単一責任の原則に沿った分割
- Props型の明示的な定義
- `forwardRef` の適切な使用

```typescript
// apps/web/components/field-renderer.tsx
export const FieldRenderer = forwardRef(function FieldRenderer(
  { field, value, hasError = false, ... }: FieldRendererProps,
  ref: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  // フィールド型に応じた描画
});
```

**2. 状態管理**
- `useState`, `useMemo`, `useCallback` の適切な使用
- 不要な再レンダリングを防ぐメモ化

```typescript
// apps/web/components/document-editor.tsx
const validation = useMemo(() => validateDocument(currentDocumentState), [currentDocumentState]);
const documentById = useMemo(
  () => Object.fromEntries(projectState.documents.map((document) => [document.id, document])),
  [projectState.documents]
);
```

**3. バリデーションロジックの分離**
- `lib/validation/` 配下にルールを分離
- テーブル単位のバリデータパターン

```typescript
// apps/web/lib/validation/validate-design-quality.ts
const TABLE_VALIDATORS: Record<string, ValidatorFn> = {
  "screen-fields": validateScreenFields,
  events: validateEvents,
  messages: validateMessages,
  // ...
};
```

#### 改善が必要な点

**1. インラインスタイルの多用**

```typescript
// apps/web/components/document-editor.tsx
<main
  style={{
    fontFamily: "'Helvetica Neue', Arial, ...",
    backgroundColor: "#F1F5F9",
    minHeight: "100vh",
    padding: "24px",
    // 約10行のスタイル定義
  }}
>
```

**問題点**:
- スタイルの再利用性が低い
- コンポーネントの可読性が下がる
- 型安全性はあるが、保守性に課題

**推奨**:
- CSS Modules または Tailwind CSS の導入
- スタイル定数の外部ファイル化
- デザイントークンの統一

**2. コンポーネントの肥大化**

`DocumentEditor` コンポーネントは約615行あり、以下の責務を持つ:
- プロジェクト状態管理
- ドキュメント選択
- バリデーション
- ナビゲーション
- UIレンダリング

**推奨**:
- カスタムフックへの状態ロジック抽出
- コンテナ/プレゼンテーショナル分離

```typescript
// 推奨: カスタムフックによる分離例
function useDocumentEditor(project: Project) {
  const [projectState, setProjectState] = useState(...);
  const [documentStates, setDocumentStates] = useState(...);
  // ... ロジック
  return { projectState, documentStates, handlers };
}
```

**3. マジックナンバー/文字列の存在**

```typescript
// apps/web/utils/qualityScore.ts
const PENALTY = {
  error: 20,
  warning: 5,
  info: 0,
} as const;

if (score >= 90) { status = "good"; }
else if (score >= 70) { status = "caution"; }
```

**推奨**: 定数ファイルへの集約

### 3.2 バックエンド (apps/api)

#### 現状の課題

- 実装が最小限（ヘルスチェックのみ）
- データベース接続ロジックなし
- CORSミドルウェア未設定
- エラーハンドリング未実装

**推奨実装項目**:
```python
# 推奨: 基本的なAPI構造
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SpecForge API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ドキュメント保存エンドポイント
@app.post("/projects/{project_id}/documents")
async def save_document(project_id: str, document: DocumentModel):
    pass

# バリデーションエンドポイント
@app.post("/validate")
async def validate_document(document: DocumentModel):
    pass
```

### 3.3 共有パッケージ (packages/document-schema)

#### 良い点

**1. 明確な型エクスポート構造**
```typescript
// packages/document-schema/src/index.ts
export type { Project } from "./core/project";
export type { Document } from "./core/document";
export type { Section } from "./core/section";
export type { Field, FieldOption } from "./core/field";
// ...
```

**2. プリセットによるテンプレート提供**
```typescript
// packages/document-schema/src/presets/screen-spec.ts
export const screenSpecPreset: Document = {
  id: "preset-screen-spec",
  kind: "screen-spec",
  sections: [
    { id: "section-overview", ... },
    { id: "section-screen-fields", ... },
    // 詳細なテーブル定義
  ]
};
```

**3. ユーティリティ関数の提供**
```typescript
// packages/document-schema/src/utils/normalize.ts
export function normalizeProjectData(input: Project | Document): Project {
  if (isProject(input)) return input;
  if (isDocument(input)) {
    return { id: `project-${input.id}`, documents: [input], ... };
  }
  throw new Error("...");
}
```

---

## 4. セキュリティ評価

### 4.1 現状の対策

| 項目 | 状態 | 説明 |
|------|------|------|
| XSS対策 | ○ | React の自動エスケープ |
| 入力バリデーション | △ | フロントエンドのみ |
| 認証・認可 | × | 未実装 |
| CORS | × | API未設定 |
| 環境変数管理 | ○ | .env.example 提供 |

### 4.2 推奨事項

**1. 入力サニタイズの強化**

現状、Markdownレンダリングに `react-markdown` を使用:
```typescript
// apps/web/components/common/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";
```

**推奨**: `rehype-sanitize` プラグインの追加
```typescript
import rehypeSanitize from "rehype-sanitize";
<ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
```

**2. API認証の実装**

将来的にAPIを公開する場合:
- JWT または Session ベース認証
- Rate limiting
- 入力検証（Pydantic スキーマ）

**3. 環境変数の秘匿**

```yaml
# docker-compose.yml - 現状
environment:
  - POSTGRES_USER=specforge
  - POSTGRES_PASSWORD=specforge  # ハードコード
```

**推奨**: シークレット管理ツール使用、または環境変数参照

---

## 5. パフォーマンス評価

### 5.1 フロントエンド

#### 良い点

**メモ化の適切な使用**
```typescript
const documentById = useMemo(
  () => Object.fromEntries(projectState.documents.map((document) => [document.id, document])),
  [projectState.documents]
);
```

#### 改善ポイント

**1. バリデーションの重複実行**

```typescript
// apps/web/components/document-editor.tsx
const validation = useMemo(() => validateDocument(currentDocumentState), [currentDocumentState]);
const designQuality = useMemo(() => validateDesignQuality(currentDocumentState, projectState), ...);

// allValidationItems でも再計算
const allValidationItems = useMemo(() => {
  for (const doc of projectState.documents) {
    const docValidation = validateDocument(state); // 重複
  }
}, ...);
```

**推奨**: バリデーション結果のキャッシュ戦略

**2. 大規模プロジェクトでのレンダリング**

```typescript
// ProjectHealthDashboard.tsx
{sortedDocs.map((doc) => (
  <div key={doc.id}>...</div>
))}
```

**推奨**: 仮想スクロール（react-window等）の導入検討

**3. バンドルサイズ**

現在の依存関係:
- next: 14.2.18
- react-markdown: 10.1.0

**推奨**:
- dynamic import による遅延読み込み
- バンドル分析（@next/bundle-analyzer）

---

## 6. 保守性評価

### 6.1 良い点

**1. ドキュメント優先の開発方針**
- `docs/product/vision.md`: プロダクトビジョン
- `docs/architecture/`: アーキテクチャ原則
- 実装前に思想を文書化

**2. 命名規則の一貫性**
- ファイル名: kebab-case (`document-editor.tsx`)
- 型名: PascalCase (`DocumentEditorState`)
- 変数名: camelCase (`fieldValues`)

**3. エラーメッセージの日本語対応**
```typescript
// apps/web/lib/validation/rules/screen-fields.ts
message: `行 ${rowIndex + 1}: 項目名が空で項目キーのみ入力されています`,
reason: "項目名がないと、設計書を読む人がその項目の用途を理解できません。",
fix: `行 ${rowIndex + 1} の「項目名」にユーザーに見える表示名を入力してください。`,
```

### 6.2 改善ポイント

**1. テストの不足**

プロジェクト内にテストファイルが存在しない:
- 単体テスト: なし
- 統合テスト: なし
- E2Eテスト: なし

**推奨テスト戦略**:

```typescript
// 推奨: packages/document-schema のテスト例
// packages/document-schema/src/__tests__/normalize.test.ts
import { normalizeProjectData, isProject, isDocument } from "../utils/normalize";

describe("normalizeProjectData", () => {
  it("should return project as-is if input is already a project", () => {
    const project = { id: "p1", title: "Test", documents: [] };
    expect(normalizeProjectData(project)).toBe(project);
  });

  it("should wrap document in project", () => {
    const document = { id: "d1", kind: "screen-spec", sections: [] };
    const result = normalizeProjectData(document);
    expect(result.documents).toContain(document);
  });
});
```

```typescript
// 推奨: apps/web のコンポーネントテスト例
// apps/web/components/__tests__/field-renderer.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldRenderer } from "../field-renderer";

describe("FieldRenderer", () => {
  it("renders text input for text valueType", () => {
    const field = { id: "f1", valueType: "text", label: "Name", required: true };
    render(<FieldRenderer field={field} value="" onValueChange={jest.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
```

**推奨ツール**:
- Vitest (単体テスト)
- React Testing Library (コンポーネントテスト)
- Playwright (E2Eテスト)

**2. エラーハンドリングの不統一**

```typescript
// 現状: throw での例外
throw new Error("normalizeProjectData: input is neither a Project nor a Document");

// 推奨: Result型パターンの導入
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function normalizeProjectData(input: unknown): Result<Project, string> {
  if (isProject(input)) return { ok: true, value: input };
  if (isDocument(input)) return { ok: true, value: wrapDocument(input) };
  return { ok: false, error: "Invalid input" };
}
```

**3. ログ機能の不在**

本番環境でのデバッグ・監視のためのログ機能がない。

**推奨**: 構造化ログの導入
```typescript
// 推奨: ロガーユーティリティ
const logger = {
  info: (message: string, context?: object) => { ... },
  error: (message: string, error?: Error, context?: object) => { ... },
};
```

---

## 7. 改善提案サマリー

### 優先度: 高

| No. | 項目 | 理由 | 工数目安 |
|-----|------|------|----------|
| 1 | テスト導入 | 品質保証の基盤 | 中 |
| 2 | API実装 | データ永続化に必須 | 大 |
| 3 | 認証機能 | マルチユーザー対応 | 大 |

### 優先度: 中

| No. | 項目 | 理由 | 工数目安 |
|-----|------|------|----------|
| 4 | CSS抽出 | 保守性向上 | 小 |
| 5 | カスタムフック分離 | コード整理 | 小 |
| 6 | エラーハンドリング統一 | 安定性向上 | 小 |

### 優先度: 低

| No. | 項目 | 理由 | 工数目安 |
|-----|------|------|----------|
| 7 | 仮想スクロール | 大規模対応 | 小 |
| 8 | バンドル最適化 | UX改善 | 小 |
| 9 | ログ機能 | 運用支援 | 小 |

---

## 8. まとめ

SpecForgeは、設計書品質の向上という明確なビジョンのもと、適切なアーキテクチャで構築されています。

**強み**:
- TypeScript による型安全性
- モノレポによる効率的な開発体制
- ドメインロジックの適切な分離
- ドキュメント優先の開発文化

**課題**:
- テストカバレッジの不足
- バックエンドAPI の未実装
- インラインスタイルの多用

今後のフェーズで上記の改善を段階的に実施することで、より堅牢で保守性の高いプラットフォームへと成長できると考えます。

---

*このレポートは2026-05-17時点のコードベースに基づいています。*
