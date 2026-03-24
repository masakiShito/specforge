import type { FieldValueType } from "../enums/field-value-type.js";
import type { Reference } from "./reference.js";
import type { Table } from "./table.js";

export interface FieldOption {
  id: string;
  value: string;
  label: string;
}

export interface Field {
  id: string;
  key: string;
  label: string;
  required: boolean;
  valueType: FieldValueType;
  description?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: FieldOption[];
  table?: Table;
  reference?: Reference;
}
