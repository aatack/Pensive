import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { Entity } from "./entity";
import { EntityContent } from "./content";

export const RowEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    return (
      <>
        <tr>
          <EntityContent resolvedQuery={resolvedQuery} />
        </tr>

        <>
          {resolvedQuery.children.map(({ value, key }) => (
            <td>
              <Entity resolvedQuery={value} key={key} />
            </td>
          ))}
        </>

        {resolvedQuery.createEntity ? (
          <tr>
            <CreateEntity />
          </tr>
        ) : null}
      </>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);
