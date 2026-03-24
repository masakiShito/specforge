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
      fields: [
        {
          id: "field-screen-fields-table",
          key: "screen-fields",
          label: "Screen Fields",
          required: true,
          valueType: "table",
          table: {
            id: "table-screen-fields",
            key: "screen-fields",
            title: "Screen Fields",
            required: true,
            columns: [
              {
                id: "column-name",
                key: "name",
                label: "Name",
                required: true,
                valueType: "text"
              },
              {
                id: "column-type",
                key: "type",
                label: "Type",
                required: true,
                valueType: "text"
              },
              {
                id: "column-required",
                key: "required",
                label: "Required",
                required: true,
                valueType: "boolean"
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
      fields: [
        {
          id: "field-events",
          key: "events",
          label: "Events",
          required: true,
          valueType: "textarea"
        }
      ]
    },
    {
      id: "section-messages",
      key: "messages",
      title: "Messages",
      required: true,
      fields: [
        {
          id: "field-messages",
          key: "messages",
          label: "Messages",
          required: true,
          valueType: "textarea"
        }
      ]
    },
    {
      id: "section-api-links",
      key: "api-links",
      title: "API Links",
      required: false,
      fields: [
        {
          id: "field-api-links",
          key: "api-links",
          label: "Linked APIs",
          required: false,
          valueType: "reference",
          reference: {
            id: "ref-api-spec",
            key: "api-spec-ref",
            label: "Related API Specification",
            required: false,
            kind: "document"
          }
        }
      ]
    }
  ]
};
