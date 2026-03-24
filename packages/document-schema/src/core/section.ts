import type { Field } from "./field";
import type { Reference } from "./reference";

export interface Section {
  id: string;
  key: string;
  title: string;
  required: boolean;
  description?: string;
  fields: Field[];
  references?: Reference[];
}
