import type { FieldValueType } from "../enums/field-value-type";
import type { Reference } from "./reference";
import type { Table } from "./table";

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
