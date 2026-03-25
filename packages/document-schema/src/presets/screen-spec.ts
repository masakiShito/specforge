import type { Document } from "../core/document";

export const screenSpecPreset: Document = {
  id: "preset-screen-spec",
  key: "screen-spec-template",
  title: "Screen Specification",
  required: true,
  kind: "screen-spec",
  version: "1.0.0",
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
          valueType: "textarea"
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
          valueType: "textarea"
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
                description: "プログラム上の識別キー。画面内で一意にします"
              },
              {
                id: "col-sf-input-type",
                key: "inputType",
                label: "入力形式",
                required: true,
                valueType: "enum",
                description: "入力ウィジェットの種類",
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
                valueType: "boolean",
                description: "ユーザー入力が必須かどうか"
              },
              {
                id: "col-sf-editable",
                key: "editable",
                label: "編集可",
                required: false,
                valueType: "boolean",
                description: "ユーザーが値を変更できるか"
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
                description: "イベントが発火するタイミング",
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
                description: "メッセージの分類（info/warning/error/confirm）",
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
                id: "col-api-ref",
                key: "targetDocumentId",
                label: "API参照",
                required: false,
                valueType: "enum",
                description: "Project内のAPI仕様書を選択します。選択肢はProject内のapi-specから自動生成されます。",
                options: []
              },
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
            ]
          }
        }
      ]
    }
  ]
};
