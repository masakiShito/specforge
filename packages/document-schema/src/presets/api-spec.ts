import type { Document } from "../core/document";

export const apiSpecPreset: Document = {
  id: "preset-api-spec",
  key: "api-spec-template",
  title: "API Specification",
  required: true,
  kind: "api-spec",
  version: "1.0.0",
  sections: [
    {
      id: "section-overview",
      key: "overview",
      title: "Overview",
      required: true,
      description: "APIの概要・目的を記載します",
      fields: [
        {
          id: "field-api-purpose",
          key: "purpose",
          label: "目的",
          required: true,
          valueType: "textarea",
          description: "このAPIが提供する機能と、なぜ必要かを記載します",
          placeholder: "例: ユーザーの注文情報を確定し、決済処理を実行するAPIです。"
        }
      ]
    },
    {
      id: "section-endpoint-basic",
      key: "endpoint-basic",
      title: "Endpoint Basic Info",
      required: true,
      description: "エンドポイントの基本情報を定義します",
      fields: [
        {
          id: "field-endpoint",
          key: "endpoint",
          label: "エンドポイント",
          required: true,
          valueType: "text",
          description: "APIのURLパス",
          placeholder: "例: /api/v1/orders"
        },
        {
          id: "field-http-method",
          key: "httpMethod",
          label: "HTTPメソッド",
          required: true,
          valueType: "enum",
          description: "使用するHTTPメソッド",
          options: [
            { id: "opt-get", value: "GET", label: "GET" },
            { id: "opt-post", value: "POST", label: "POST" },
            { id: "opt-put", value: "PUT", label: "PUT" },
            { id: "opt-patch", value: "PATCH", label: "PATCH" },
            { id: "opt-delete", value: "DELETE", label: "DELETE" }
          ]
        },
        {
          id: "field-auth-required",
          key: "authRequired",
          label: "認証要否",
          required: true,
          valueType: "boolean",
          description: "認証が必要かどうか"
        },
        {
          id: "field-summary",
          key: "summary",
          label: "概要",
          required: true,
          valueType: "text",
          description: "APIの1行要約",
          placeholder: "例: 注文確定・決済実行"
        }
      ]
    },
    {
      id: "section-request-parameters",
      key: "request-parameters",
      title: "Request Parameters",
      required: true,
      description: "リクエストパラメータの一覧を定義します",
      fields: [
        {
          id: "field-request-params-table",
          key: "request-parameters",
          label: "リクエストパラメータ一覧",
          required: true,
          valueType: "table",
          description: "APIに送信するすべてのパラメータを定義します",
          table: {
            id: "table-request-params",
            key: "request-parameters",
            title: "リクエストパラメータ一覧",
            required: true,
            columns: [
              {
                id: "col-rp-name",
                key: "parameterName",
                label: "項目名",
                required: true,
                valueType: "text",
                description: "パラメータの表示名"
              },
              {
                id: "col-rp-key",
                key: "parameterKey",
                label: "パラメータキー",
                required: true,
                valueType: "text",
                description: "JSON/クエリパラメータのキー名"
              },
              {
                id: "col-rp-type",
                key: "dataType",
                label: "型",
                required: true,
                valueType: "enum",
                description: "データ型",
                options: [
                  { id: "opt-dt-string", value: "string", label: "string" },
                  { id: "opt-dt-number", value: "number", label: "number" },
                  { id: "opt-dt-boolean", value: "boolean", label: "boolean" },
                  { id: "opt-dt-object", value: "object", label: "object" },
                  { id: "opt-dt-array", value: "array", label: "array" }
                ]
              },
              {
                id: "col-rp-required",
                key: "required",
                label: "必須",
                required: true,
                valueType: "boolean",
                description: "必須パラメータかどうか"
              },
              {
                id: "col-rp-description",
                key: "description",
                label: "説明",
                required: true,
                valueType: "text",
                description: "パラメータの説明"
              },
              {
                id: "col-rp-note",
                key: "note",
                label: "備考",
                required: false,
                valueType: "text",
                description: "制約事項、フォーマットなど"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-response-parameters",
      key: "response-parameters",
      title: "Response Parameters",
      required: true,
      description: "レスポンスパラメータの一覧を定義します",
      fields: [
        {
          id: "field-response-params-table",
          key: "response-parameters",
          label: "レスポンスパラメータ一覧",
          required: true,
          valueType: "table",
          description: "APIから返却されるすべてのパラメータを定義します",
          table: {
            id: "table-response-params",
            key: "response-parameters",
            title: "レスポンスパラメータ一覧",
            required: true,
            columns: [
              {
                id: "col-resp-name",
                key: "parameterName",
                label: "項目名",
                required: true,
                valueType: "text",
                description: "パラメータの表示名"
              },
              {
                id: "col-resp-key",
                key: "parameterKey",
                label: "パラメータキー",
                required: true,
                valueType: "text",
                description: "JSON レスポンスのキー名"
              },
              {
                id: "col-resp-type",
                key: "dataType",
                label: "型",
                required: true,
                valueType: "enum",
                description: "データ型",
                options: [
                  { id: "opt-rdt-string", value: "string", label: "string" },
                  { id: "opt-rdt-number", value: "number", label: "number" },
                  { id: "opt-rdt-boolean", value: "boolean", label: "boolean" },
                  { id: "opt-rdt-object", value: "object", label: "object" },
                  { id: "opt-rdt-array", value: "array", label: "array" }
                ]
              },
              {
                id: "col-resp-description",
                key: "description",
                label: "説明",
                required: true,
                valueType: "text",
                description: "パラメータの説明"
              },
              {
                id: "col-resp-note",
                key: "note",
                label: "備考",
                required: false,
                valueType: "text"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-error-responses",
      key: "error-responses",
      title: "Error Responses",
      required: true,
      description: "エラーレスポンスの一覧を定義します",
      fields: [
        {
          id: "field-error-responses-table",
          key: "error-responses",
          label: "エラーレスポンス一覧",
          required: true,
          valueType: "table",
          description: "発生しうるエラーとそのレスポンスを定義します",
          table: {
            id: "table-error-responses",
            key: "error-responses",
            title: "エラーレスポンス一覧",
            required: true,
            columns: [
              {
                id: "col-err-code",
                key: "errorCode",
                label: "エラーコード",
                required: true,
                valueType: "text",
                description: "HTTPステータスコードまたはアプリケーションエラーコード"
              },
              {
                id: "col-err-name",
                key: "errorName",
                label: "エラー名",
                required: true,
                valueType: "text",
                description: "エラーの名称"
              },
              {
                id: "col-err-condition",
                key: "condition",
                label: "発生条件",
                required: true,
                valueType: "text",
                description: "このエラーが発生する条件"
              },
              {
                id: "col-err-message",
                key: "message",
                label: "メッセージ",
                required: true,
                valueType: "text",
                description: "レスポンスに含まれるエラーメッセージ"
              },
              {
                id: "col-err-note",
                key: "note",
                label: "備考",
                required: false,
                valueType: "text"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-processing-flow",
      key: "processing-flow",
      title: "Processing Flow",
      required: true,
      description: "APIの処理フローを記載します",
      fields: [
        {
          id: "field-processing-flow",
          key: "processingFlow",
          label: "処理フロー",
          required: true,
          valueType: "textarea",
          description: "リクエスト受信からレスポンス返却までの処理概要を記載します",
          placeholder: "例:\n1. リクエストバリデーション\n2. 認証・認可チェック\n3. カート情報取得\n4. 在庫確認\n5. 決済処理実行\n6. 注文レコード作成\n7. レスポンス返却"
        }
      ]
    }
  ]
};
