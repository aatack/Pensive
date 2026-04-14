import { LlmContext } from "../../llms";

export type EntityState = Partial<{
  text: string | null;

  open: boolean | null;
  section: boolean | null;

  inbound: EntityId[] | null;
  outbound: EntityId[] | null;

  image: boolean | null;
  type: "table" | "formula" | "formulaTest" | null;

  redacted: boolean | null;
  snoozed: string | null; // ISO format
  llmContext: LlmContext | null;
  ai: boolean | null;
}>;

export type EntityId = string;
