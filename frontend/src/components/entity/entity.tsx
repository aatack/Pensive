import { useHotkeys } from "react-hotkeys-hook";
import { useEntity } from "../../context/hooks";
import { LlmContext } from "../../llms";
import { ResolvedQuery } from "../pensive";
import { RowEntity } from "./row-entity";
import { TableEntity } from "./table-entity";
import { TreeEntity } from "./tree-entity";
import { parse, serialise, transpile } from "@pensive/common";

export type EntityState = Partial<{
  text: string | null;

  open: boolean | null;
  section: boolean | null;

  inbound: EntityId[] | null;
  outbound: EntityId[] | null;

  image: boolean | null;

  redacted: boolean | null;
  snoozed: string | null; // ISO format
  llmContext: LlmContext | null;
}>;

export type EntityId = string;

export const Entity = ({
  resolvedQuery,
  row,
}: {
  resolvedQuery: ResolvedQuery;
  row?: boolean;
}) => {
  // Make sure the entity stays loaded
  useEntity(resolvedQuery.entityId);

  useHotkeys(
    "n",
    () => {
      const text = resolvedQuery.entity.text ?? "";

      const result = parse(text);
      if (result.valid) {
        console.log(serialise(transpile(result.value)));
      }
    },
    { enabled: resolvedQuery.selected }
  );

  if (row) {
    return <RowEntity resolvedQuery={resolvedQuery} />;
  } else if (resolvedQuery.entity.text === "TABLE") {
    return <TableEntity resolvedQuery={resolvedQuery} />;
  } else {
    return <TreeEntity resolvedQuery={resolvedQuery} />;
  }
};
