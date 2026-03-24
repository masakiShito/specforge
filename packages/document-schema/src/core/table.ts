import type { Field } from "./field.js";

export interface Table {
  id: string;
  key: string;
  title: string;
  required: boolean;
  columns: Field[];
  minRows?: number;
  maxRows?: number;
}
