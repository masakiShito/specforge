/**
 * kind 別ガイドコンテンツ
 *
 * ドキュメント種別に応じて適切なガイドを表示する。
 */

import type { DocumentKind } from "@specforge/document-schema";

export const screenSpecGuide = `# 画面仕様書ガイド

画面仕様書（screen-spec）は、1画面 = 1ドキュメントとして定義します。
このガイドでは画面仕様書の書き方を説明します。

## セクション構成

### Overview
画面の目的・概要を記載します。
この画面が「何のために」「誰のために」あるかを1〜2文で表現してください。

### Usage Scenario
ユーザーがこの画面をどのように使うかのシナリオを記載します。

### Screen Fields（画面項目一覧）
画面に表示されるすべての入力項目・表示項目を定義します。

| 列名 | 説明 |
|------|------|
| 項目名 | 画面上の表示名 |
| 項目キー | プログラム上の識別キー（画面内で一意） |
| 入力形式 | text / textarea / select / checkbox 等 |
| 必須 | 入力が必須かどうか |
| 編集可 | ユーザーが値を変更できるか |
| 表示条件 | 項目が表示される条件 |
| 入力制御 | バリデーションルール |
| 備考 | 補足事項 |

### Events（イベント一覧）
画面上で発生するイベントとその処理内容を定義します。

> API呼出系の処理では「対象」に呼び出すAPI名を必ず記載してください。

### Messages（メッセージ一覧）
画面に表示されるメッセージを定義します。

### API Connections（API連携一覧）
画面から呼び出すAPIの一覧です。

> **Phase2 新機能**: 「API参照」列からProject内のAPI仕様書を直接選択できます。
> 選択すると参照関係が構築され、整合性チェックが自動で行われます。

## バリデーションルール
- 項目キーの重複 → エラー
- label + 編集可=true → 警告
- button + 必須=true → 警告
- API呼出なのに対象未指定 → エラー
- API参照先が存在しない → エラー

## Tips
- セクション名の横のバッジで入力状態を確認できます
- 必須項目を先に埋めるとQuality Scoreが上がります
`;

export const apiSpecGuide = `# API仕様書ガイド

API仕様書（api-spec）は、1 API = 1ドキュメントとして定義します。
このガイドではAPI仕様書の書き方を説明します。

## セクション構成

### Overview
APIの概要・目的を記載します。
このAPIが「何をする」ためのものかを簡潔に記載してください。

### Endpoint Basic Info
APIの基本情報を定義します。

| 項目 | 説明 |
|------|------|
| エンドポイント | APIのURLパス（例: /api/v1/orders） |
| HTTPメソッド | GET / POST / PUT / PATCH / DELETE |
| 認証要否 | 認証が必要かどうか |
| 概要 | APIの1行要約 |

> エンドポイントとHTTPメソッドは必須です。未入力だとエラーになります。

### Request Parameters（リクエストパラメータ一覧）
APIに送信するパラメータを定義します。

| 列名 | 説明 |
|------|------|
| 項目名 | パラメータの表示名 |
| パラメータキー | JSON/クエリパラメータのキー名 |
| 型 | string / number / boolean / object / array |
| 必須 | 必須パラメータかどうか |
| 説明 | パラメータの説明 |
| 備考 | 制約事項、フォーマットなど |

### Response Parameters（レスポンスパラメータ一覧）
APIから返却されるパラメータを定義します。

> レスポンスパラメータが空だと警告が表示されます。

### Error Responses（エラーレスポンス一覧）
発生しうるエラーとそのレスポンスを定義します。

| 列名 | 説明 |
|------|------|
| エラーコード | HTTPステータスコードまたはアプリケーションエラーコード |
| エラー名 | エラーの名称 |
| 発生条件 | このエラーが発生する条件 |
| メッセージ | レスポンスに含まれるエラーメッセージ |
| 備考 | 補足事項 |

> エラーレスポンスが空だと警告が表示されます。

### Processing Flow（処理フロー）
リクエスト受信からレスポンス返却までの処理概要を記載します。
箇条書きで処理ステップを順に記載するのが効果的です。

## バリデーションルール
- エンドポイント未入力 → エラー
- HTTPメソッド未選択 → エラー
- パラメータキーの重複 → エラー
- レスポンスパラメータ空 → 警告
- エラーレスポンス未定義 → 警告

## Tips
- 画面仕様書のAPI Connectionsから参照される仕様書です
- ドキュメントタイトルはAPI名として利用されます
- タイトルは後から編集可能です
`;

const GUIDE_MAP: Record<string, string> = {
  "screen-spec": screenSpecGuide,
  "api-spec": apiSpecGuide,
};

/**
 * Get guide content for a specific document kind.
 * Falls back to the default guide if no kind-specific guide exists.
 */
export function getGuideContent(kind?: DocumentKind | string): string {
  if (kind && GUIDE_MAP[kind]) {
    return GUIDE_MAP[kind];
  }
  return screenSpecGuide;
}

/** @deprecated Use getGuideContent(kind) instead */
export const guideContent = screenSpecGuide;
