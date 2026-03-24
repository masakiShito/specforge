import type { Project } from "../core/project.js";

export const sampleScreenSpecProject: Project = {
  id: "project-payment",
  key: "payment-platform",
  title: "Payment Platform",
  required: true,
  description: "Sample project that includes one screen spec document.",
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
          id: "section-screen-fields",
          key: "screen-fields",
          title: "Screen Fields",
          required: true,
          fields: [
            {
              id: "field-screen-fields",
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
                    id: "column-field-name",
                    key: "name",
                    label: "Name",
                    required: true,
                    valueType: "text"
                  },
                  {
                    id: "column-field-format",
                    key: "format",
                    label: "Format",
                    required: true,
                    valueType: "text"
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
};
