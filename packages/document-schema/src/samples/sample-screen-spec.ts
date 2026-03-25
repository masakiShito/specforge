import type { Document } from "../core/document";
import type { Project } from "../core/project";

/**
 * Dummy API spec document for multi-document switching demo.
 * This is intentionally minimal — full api-spec implementation is a future phase.
 */
const dummySubmitOrderApiDoc: Document = {
  id: "doc-submit-order-api",
  key: "submit-order-api",
  title: "Submit Order API",
  required: true,
  kind: "api-spec",
  version: "0.1.0",
  tags: ["order", "api"],
  sections: [
    {
      id: "section-api-overview",
      key: "overview",
      title: "Overview",
      required: true,
      fields: [
        {
          id: "field-api-summary",
          key: "summary",
          label: "Summary",
          required: true,
          valueType: "textarea",
          defaultValue: "注文確定APIは、カート内の商品を確定し決済処理を実行するエンドポイントです。",
        },
      ],
    },
    {
      id: "section-api-request",
      key: "request",
      title: "Request",
      required: true,
      fields: [
        {
          id: "field-api-method",
          key: "method",
          label: "HTTP Method",
          required: true,
          valueType: "enum",
          defaultValue: "POST",
          options: [
            { id: "method-get", value: "GET", label: "GET" },
            { id: "method-post", value: "POST", label: "POST" },
            { id: "method-put", value: "PUT", label: "PUT" },
            { id: "method-delete", value: "DELETE", label: "DELETE" },
          ],
        },
        {
          id: "field-api-path",
          key: "path",
          label: "Path",
          required: true,
          valueType: "text",
          defaultValue: "/api/v1/orders",
        },
      ],
    },
    {
      id: "section-api-response",
      key: "response",
      title: "Response",
      required: true,
      fields: [
        {
          id: "field-api-response-body",
          key: "response-body",
          label: "Response Body",
          required: true,
          valueType: "textarea",
          defaultValue: '{ "orderId": "string", "status": "confirmed | failed", "totalAmount": "number" }',
        },
      ],
    },
  ],
};

export const sampleScreenSpecProject: Project = {
  id: "project-payment",
  key: "payment-platform",
  title: "Payment Platform",
  required: true,
  description: "Sample project that includes screen spec and API spec documents.",
  documents: [
    {
      id: "doc-checkout-screen",
      key: "checkout-screen",
      title: "Checkout Screen",
      required: true,
      kind: "screen-spec",
      version: "0.1.0",
      tags: ["checkout", "payment"],
      sections: [
        {
          id: "section-overview",
          key: "overview",
          title: "Overview",
          required: true,
          fields: [
            {
              id: "field-purpose",
              key: "purpose",
              label: "Purpose",
              required: true,
              valueType: "textarea",
              defaultValue: "Collect payment details and submit an order."
            }
          ]
        },
        {
          id: "section-usage-scenario",
          key: "usage-scenario",
          title: "Usage Scenario",
          required: true,
          fields: [
            {
              id: "field-main-scenario",
              key: "main-scenario",
              label: "Main Scenario",
              required: true,
              valueType: "textarea",
              defaultValue: "ユーザーが商品をカートに入れた後、決済画面に遷移し、支払い方法を選択して注文を確定する。"
            }
          ]
        },
        {
          id: "section-screen-fields",
          key: "screen-fields",
          title: "Screen Fields",
          required: true,
          description: "画面に表示される入力項目・表示項目の一覧",
          fields: [
            {
              id: "field-screen-fields-table",
              key: "screen-fields",
              label: "画面項目一覧",
              required: true,
              valueType: "table",
              description: "画面上のすべての入力項目・表示項目を定義します",
              table: {
                id: "table-screen-fields",
                key: "screen-fields",
                title: "画面項目一覧",
                required: true,
                columns: [
                  {
                    id: "col-sf-name",
                    key: "name",
                    label: "項目名",
                    required: true,
                    valueType: "text",
                    description: "画面上の表示名"
                  },
                  {
                    id: "col-sf-field-key",
                    key: "fieldKey",
                    label: "項目キー",
                    required: true,
                    valueType: "text",
                    description: "プログラム上の識別キー"
                  },
                  {
                    id: "col-sf-input-type",
                    key: "inputType",
                    label: "入力形式",
                    required: true,
                    valueType: "enum",
                    options: [
                      { id: "opt-input-text", value: "text", label: "text" },
                      { id: "opt-input-textarea", value: "textarea", label: "textarea" },
                      { id: "opt-input-select", value: "select", label: "select" },
                      { id: "opt-input-checkbox", value: "checkbox", label: "checkbox" },
                      { id: "opt-input-radio", value: "radio", label: "radio" },
                      { id: "opt-input-date", value: "date", label: "date" },
                      { id: "opt-input-number", value: "number", label: "number" },
                      { id: "opt-input-label", value: "label", label: "label" },
                      { id: "opt-input-button", value: "button", label: "button" }
                    ]
                  },
                  {
                    id: "col-sf-required",
                    key: "required",
                    label: "必須",
                    required: true,
                    valueType: "boolean"
                  },
                  {
                    id: "col-sf-editable",
                    key: "editable",
                    label: "編集可",
                    required: false,
                    valueType: "boolean"
                  },
                  {
                    id: "col-sf-visible-condition",
                    key: "visibleCondition",
                    label: "表示条件",
                    required: false,
                    valueType: "text",
                    placeholder: "例: paymentMethod === 'credit'"
                  },
                  {
                    id: "col-sf-validation-rule",
                    key: "validationRule",
                    label: "入力制御",
                    required: false,
                    valueType: "text",
                    placeholder: "例: maxLength(100)"
                  },
                  {
                    id: "col-sf-note",
                    key: "note",
                    label: "備考",
                    required: false,
                    valueType: "text"
                  }
                ],
                defaultRows: [
                  {
                    name: "カード番号",
                    fieldKey: "cardNumber",
                    inputType: "text",
                    required: true,
                    editable: true,
                    visibleCondition: "paymentMethod === 'credit'",
                    validationRule: "pattern(^[0-9]{16}$)",
                    note: "ハイフンなし16桁"
                  },
                  {
                    name: "有効期限",
                    fieldKey: "expiryDate",
                    inputType: "text",
                    required: true,
                    editable: true,
                    visibleCondition: "paymentMethod === 'credit'",
                    validationRule: "pattern(^(0[1-9]|1[0-2])/[0-9]{2}$)",
                    note: "MM/YY形式"
                  },
                  {
                    name: "支払い方法",
                    fieldKey: "paymentMethod",
                    inputType: "select",
                    required: true,
                    editable: true,
                    visibleCondition: "",
                    validationRule: "",
                    note: "credit / bank / convenience"
                  },
                  {
                    name: "注文合計",
                    fieldKey: "orderTotal",
                    inputType: "label",
                    required: true,
                    editable: false,
                    visibleCondition: "",
                    validationRule: "",
                    note: "税込み金額を表示"
                  }
                ]
              }
            }
          ]
        },
        {
          id: "section-events",
          key: "events",
          title: "Events",
          required: true,
          description: "画面上で発生するイベントと処理の一覧",
          fields: [
            {
              id: "field-events-table",
              key: "events",
              label: "イベント一覧",
              required: true,
              valueType: "table",
              description: "画面で発生するイベントとその処理内容を定義します",
              table: {
                id: "table-events",
                key: "events",
                title: "イベント一覧",
                required: true,
                columns: [
                  {
                    id: "col-ev-name",
                    key: "eventName",
                    label: "イベント名",
                    required: true,
                    valueType: "text",
                    description: "イベントの名称"
                  },
                  {
                    id: "col-ev-trigger-type",
                    key: "triggerType",
                    label: "契機",
                    required: true,
                    valueType: "enum",
                    options: [
                      { id: "opt-trigger-onload", value: "onLoad", label: "onLoad" },
                      { id: "opt-trigger-onclick", value: "onClick", label: "onClick" },
                      { id: "opt-trigger-onchange", value: "onChange", label: "onChange" },
                      { id: "opt-trigger-onsubmit", value: "onSubmit", label: "onSubmit" }
                    ]
                  },
                  {
                    id: "col-ev-action-type",
                    key: "actionType",
                    label: "処理種別",
                    required: true,
                    valueType: "text",
                    description: "実行される処理の種類"
                  },
                  {
                    id: "col-ev-target",
                    key: "target",
                    label: "対象",
                    required: false,
                    valueType: "text",
                    description: "処理の対象となる要素やAPI"
                  },
                  {
                    id: "col-ev-note",
                    key: "note",
                    label: "備考",
                    required: false,
                    valueType: "text"
                  }
                ],
                defaultRows: [
                  {
                    eventName: "画面初期表示",
                    triggerType: "onLoad",
                    actionType: "データ取得",
                    target: "カート情報API",
                    note: "カート内容と合計金額を取得"
                  },
                  {
                    eventName: "支払い方法変更",
                    triggerType: "onChange",
                    actionType: "表示切替",
                    target: "paymentMethod",
                    note: "選択に応じて入力フォームを切替"
                  },
                  {
                    eventName: "注文確定",
                    triggerType: "onSubmit",
                    actionType: "API呼出",
                    target: "注文確定API",
                    note: "バリデーション後にAPI呼出"
                  }
                ]
              }
            }
          ]
        },
        {
          id: "section-messages",
          key: "messages",
          title: "Messages",
          required: true,
          description: "画面に表示されるメッセージの一覧",
          fields: [
            {
              id: "field-messages-table",
              key: "messages",
              label: "メッセージ一覧",
              required: true,
              valueType: "table",
              description: "画面に表示されるすべてのメッセージを定義します",
              table: {
                id: "table-messages",
                key: "messages",
                title: "メッセージ一覧",
                required: true,
                columns: [
                  {
                    id: "col-msg-id",
                    key: "messageId",
                    label: "メッセージID",
                    required: true,
                    valueType: "text",
                    description: "メッセージの識別子"
                  },
                  {
                    id: "col-msg-type",
                    key: "messageType",
                    label: "種別",
                    required: true,
                    valueType: "enum",
                    options: [
                      { id: "opt-msg-info", value: "info", label: "info" },
                      { id: "opt-msg-warning", value: "warning", label: "warning" },
                      { id: "opt-msg-error", value: "error", label: "error" },
                      { id: "opt-msg-confirm", value: "confirm", label: "confirm" }
                    ]
                  },
                  {
                    id: "col-msg-condition",
                    key: "condition",
                    label: "表示条件",
                    required: false,
                    valueType: "text",
                    description: "メッセージが表示される条件"
                  },
                  {
                    id: "col-msg-text",
                    key: "messageText",
                    label: "文言",
                    required: true,
                    valueType: "text",
                    description: "実際に表示されるメッセージ文言"
                  },
                  {
                    id: "col-msg-note",
                    key: "note",
                    label: "備考",
                    required: false,
                    valueType: "text"
                  }
                ],
                defaultRows: [
                  {
                    messageId: "MSG-001",
                    messageType: "error",
                    condition: "カード番号が不正",
                    messageText: "有効なカード番号を入力してください",
                    note: ""
                  },
                  {
                    messageId: "MSG-002",
                    messageType: "confirm",
                    condition: "注文確定ボタン押下時",
                    messageText: "注文を確定してよろしいですか？",
                    note: "OK/キャンセルダイアログ"
                  },
                  {
                    messageId: "MSG-003",
                    messageType: "info",
                    condition: "注文完了時",
                    messageText: "ご注文ありがとうございます。注文番号は {orderId} です。",
                    note: "完了画面に遷移"
                  }
                ]
              }
            }
          ]
        },
        {
          id: "section-api-connections",
          key: "api-connections",
          title: "API Connections",
          required: false,
          description: "画面から呼び出すAPIの一覧",
          fields: [
            {
              id: "field-api-connections-table",
              key: "api-connections",
              label: "API連携一覧",
              required: false,
              valueType: "table",
              description: "画面から呼び出すAPIとその目的を定義します",
              table: {
                id: "table-api-connections",
                key: "api-connections",
                title: "API連携一覧",
                required: false,
                columns: [
                  {
                    id: "col-api-name",
                    key: "apiName",
                    label: "API名",
                    required: true,
                    valueType: "text",
                    description: "呼び出すAPIの名称"
                  },
                  {
                    id: "col-api-timing",
                    key: "timing",
                    label: "呼出タイミング",
                    required: true,
                    valueType: "text",
                    description: "APIを呼び出す契機"
                  },
                  {
                    id: "col-api-purpose",
                    key: "purpose",
                    label: "目的",
                    required: true,
                    valueType: "text",
                    description: "APIを呼び出す目的"
                  },
                  {
                    id: "col-api-input",
                    key: "inputSummary",
                    label: "主な入力",
                    required: false,
                    valueType: "text",
                    description: "APIに渡す主なパラメータ"
                  },
                  {
                    id: "col-api-output",
                    key: "outputSummary",
                    label: "主な出力",
                    required: false,
                    valueType: "text",
                    description: "APIから返される主なデータ"
                  },
                  {
                    id: "col-api-note",
                    key: "note",
                    label: "備考",
                    required: false,
                    valueType: "text"
                  }
                ],
                defaultRows: [
                  {
                    apiName: "カート情報取得API",
                    timing: "画面初期表示時",
                    purpose: "カート内の商品と合計金額を取得",
                    inputSummary: "sessionId",
                    outputSummary: "items[], totalAmount",
                    note: ""
                  },
                  {
                    apiName: "注文確定API",
                    timing: "注文確定ボタン押下時",
                    purpose: "注文を確定し決済処理を実行",
                    inputSummary: "cartId, paymentInfo",
                    outputSummary: "orderId, status",
                    note: "決済失敗時はエラーメッセージを返却"
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    dummySubmitOrderApiDoc,
  ]
};
