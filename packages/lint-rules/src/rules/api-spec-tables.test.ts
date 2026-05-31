import { describe, expect, it } from "vitest";

import {
  isErrorResponsesTable,
  isRequestParamsTable,
  isResponseSchemaTable,
  validateErrorResponses,
  validateRequestParameters,
  validateResponseParameters,
} from "./api-spec-tables";
import type { TableValidationContext } from "../types";

const ctx: TableValidationContext = {
  documentId: "doc",
  sectionId: "section-api",
  sectionTitle: "API",
  fieldId: "field-api",
  fieldLabel: "API",
  tableKey: "request-parameters",
};

describe("api spec table validators", () => {
  it("validates request parameter required cells and duplicates", () => {
    const issues = validateRequestParameters([
      { parameterKey: "id", dataType: "string" },
      { parameterKey: "id", dataType: "" },
    ], [
      { key: "parameterKey", label: "Parameter Key", required: true },
      { key: "dataType", label: "Data Type", required: true },
    ], ctx);

    expect(issues.some((issue) => issue.id.endsWith(":parameterKey:duplicate"))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(":dataType:required"))).toBe(true);
  });

  it("validates response parameter and error response duplicates", () => {
    const responseIssues = validateResponseParameters([
      { parameterKey: "name" },
      { parameterKey: "name" },
    ], [{ key: "parameterKey", label: "Parameter Key", required: true }], ctx);
    const errorIssues = validateErrorResponses([
      { errorCode: "E001" },
      { errorCode: "E001" },
    ], [{ key: "errorCode", label: "Error Code", required: true }], ctx);

    expect(responseIssues.some((issue) => issue.id.endsWith(":parameterKey:duplicate"))).toBe(true);
    expect(errorIssues.some((issue) => issue.id.endsWith(":errorCode:duplicate"))).toBe(true);
  });
});

describe("api spec table key detection", () => {
  it("recognizes web table keys", () => {
    expect(isRequestParamsTable("request-parameters")).toBe(true);
    expect(isResponseSchemaTable("response-parameters")).toBe(true);
    expect(isErrorResponsesTable("error-responses")).toBe(true);
  });
});
