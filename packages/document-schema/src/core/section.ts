import type { Field } from "./field.js";
import type { Reference } from "./reference.js";

export interface Section {
  id: string;
  key: string;
  title: string;
  required: boolean;
  description?: string;
  fields: Field[];
  references?: Reference[];
}
