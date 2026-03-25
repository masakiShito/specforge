import type { Field } from "./field";

export type TableRowValue = Record<string, string | number | boolean | undefined>;

export interface Table {
  id: string;
  key: string;
  title: string;
  required: boolean;
  columns: Field[];
  minRows?: number;
  maxRows?: number;
  defaultRows?: TableRowValue[];
}
