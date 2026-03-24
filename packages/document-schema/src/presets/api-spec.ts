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
      fields: [
        {
          id: "field-summary",
          key: "summary",
          label: "Summary",
          required: true,
          valueType: "textarea"
        }
      ]
    },
    {
      id: "section-preconditions",
      key: "preconditions",
      title: "Preconditions",
      required: true,
      fields: [
        {
          id: "field-authentication",
          key: "authentication",
          label: "Authentication",
          required: true,
          valueType: "text"
        }
      ]
    },
    {
      id: "section-request",
      key: "request",
      title: "Request",
      required: true,
      fields: [
        {
          id: "field-method",
          key: "method",
          label: "HTTP Method",
          required: true,
          valueType: "enum",
          options: [
            { id: "method-get", value: "GET", label: "GET" },
            { id: "method-post", value: "POST", label: "POST" },
            { id: "method-put", value: "PUT", label: "PUT" },
            { id: "method-delete", value: "DELETE", label: "DELETE" }
          ]
        },
        {
          id: "field-path",
          key: "path",
          label: "Path",
          required: true,
          valueType: "text"
        }
      ]
    },
    {
      id: "section-response",
      key: "response",
      title: "Response",
      required: true,
      fields: [
        {
          id: "field-response-body",
          key: "response-body",
          label: "Response Body",
          required: true,
          valueType: "textarea"
        }
      ]
    },
    {
      id: "section-error-codes",
      key: "error-codes",
      title: "Error Codes",
      required: true,
      fields: [
        {
          id: "field-error-codes",
          key: "error-codes",
          label: "Error Codes",
          required: true,
          valueType: "table",
          table: {
            id: "table-error-codes",
            key: "error-codes",
            title: "Error Codes",
            required: true,
            columns: [
              {
                id: "column-code",
                key: "code",
                label: "Code",
                required: true,
                valueType: "number"
              },
              {
                id: "column-message",
                key: "message",
                label: "Message",
                required: true,
                valueType: "text"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-process-flow",
      key: "process-flow",
      title: "Process Flow",
      required: true,
      fields: [
        {
          id: "field-process-flow",
          key: "process-flow",
          label: "Process Flow",
          required: true,
          valueType: "textarea"
        }
      ]
    }
  ]
};
