import { Stack, Typography } from "@mui/material";
import equal from "fast-deep-equal";
import { memo, ReactNode, useEffect, useRef, useState } from "react";
import { useEntity } from "../../context/hooks";
import { cursor } from "../../helpers/atoms";
import { useTabState } from "../tab";
import { CreateEntity } from "../tool/create-entity";
import { EditEntity } from "../tool/edit-entity";
import { colours, font } from "../../constants";
import { RenderImage } from "../common/image";
import { headTail } from "../../helpers/arrays";
import { ResolvedQuery } from "../pensive";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export type EntityState = {
  text?: string | null;

  open?: boolean | null;
  section?: boolean | null;

  parent?: EntityId | null;
  children?: EntityId[] | null;

  reference?: EntityId | null;
  referees?: EntityId[] | null;

  image?: { note: string; name: string }[] | null;
};

export type EntityId = string;

export const Entity = ({
  resolvedQuery,
  selectionPointer,
  createEntityPointer,
  editEntityPointer,
}: {
  resolvedQuery: ResolvedQuery;
  selectionPointer: string[] | null;
  createEntityPointer: string[] | null;
  editEntityPointer: string[] | null;
}) => {
  // Make sure the entity stays loaded
  const _ = useEntity(resolvedQuery.entityId, null);

  return (
    <RenderedEntity
      resolvedQuery={resolvedQuery}
      selectionPointer={selectionPointer}
      createEntityPointer={createEntityPointer}
      editEntityPointer={editEntityPointer}
    />
  );
};

/**
 * Render an entity, with all its dependencies loaded in advance.
 *
 * This version is cached, with its contents only being re-rendered when there's
 * a material change in some of its inputs.  This prevents eg. re-renders from
 * occurring on every entity every time the selection changes, or every time a
 * new entity is loaded from the backend.
 */
const RenderedEntity = memo(
  ({
    resolvedQuery,
    selectionPointer,
    createEntityPointer,
    editEntityPointer,
  }: {
    resolvedQuery: ResolvedQuery;
    selectionPointer: string[] | null;
    createEntityPointer: string[] | null;
    editEntityPointer: string[] | null;
  }) => {
    const selected = selectionPointer != null && selectionPointer.length === 0;

    const permanentContent = (
      <>
        <EntityChildren
          resolvedQueryChildren={resolvedQuery.children}
          selectionPointer={selectionPointer}
          createEntityPointer={createEntityPointer}
          editEntityPointer={editEntityPointer}
        />

        {createEntityPointer != null && createEntityPointer.length === 0 ? (
          <CreateEntity />
        ) : null}
      </>
    );

    return resolvedQuery.highlight ? (
      <EntityIndent entity={resolvedQuery.entity}>
        <Stack>
          <EntityContent
            entity={resolvedQuery.entity}
            entityId={resolvedQuery.entityId}
            selected={selected}
            editing={
              editEntityPointer != null && editEntityPointer.length === 0
            }
            path={resolvedQuery.path}
            collapsed={resolvedQuery.collapsed}
            hasHiddenChildren={resolvedQuery.hasHiddenChildren}
          />

          {permanentContent}
        </Stack>
      </EntityIndent>
    ) : (
      <Stack>{permanentContent}</Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

export const EntityIndent = ({
  children,
  entity,
}: {
  children: ReactNode;
  entity: EntityState;
}) => {
  return (
    <Stack direction="row" gap={1}>
      <Stack sx={{ width: 10 }}>
        <Typography sx={{ ...font, textWrap: "nowrap", userSelect: "none" }}>
          {entity.open === true
            ? "[ ]"
            : entity.open === false
            ? "[x]"
            : entity.section
            ? null
            : ">"}
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
};

export const EntityContent = ({
  entityId,
  entity,
  selected,
  path,
  editing,
  collapsed,
  hasHiddenChildren,
}: {
  entityId: string;
  entity: EntityState;
  selected: boolean;
  path?: string[];
  editing?: boolean;
  collapsed?: boolean;
  hasHiddenChildren?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [clickedPath, setClickedPath] = useState<string[] | null>(null);

  useEffect(() => {
    if (selected) {
      if (ref.current != null) {
        // Cast the element to avoid an undefined reference error on the method
        (ref.current as any).scrollIntoViewIfNeeded();
      }
    }
  }, [selected]);

  return (
    <Stack
      sx={{
        backgroundColor: selected
          ? selected
            ? "lightblue"
            : colours.ui3
          : undefined,
        transition: "background-color 0.1s ease",
        "&:hover":
          path == null
            ? {}
            : selected
            ? { cursor: "pointer" }
            : {
                backgroundColor: colours.ui,
                cursor: "pointer",
              },
        borderRadius: 1,
        paddingLeft: 0.5,
        paddingRight: 0.5,
      }}
      /* It's difficult/impossible to lazily read the value of a context in
        react.  Swapping the current frame's selection requires reading the
        value of the state context, which means that every single entity content
        element will re-render every time the selection changes.  This is much
        too slow, and is unnecessary: the current selection only needs to be
        known when the content is clicked.  To get around this, set the path to
        be selected on click.  Then, if there's a path waiting to be selected,
        render a component (`EntityContentClicked`) that accesses the tab state,
        swaps the selection, and then unrenders itself. */
      onClick={() => setClickedPath(path ?? null)}
      ref={ref}
    >
      {clickedPath == null ? null : (
        <EntityContentClicked
          path={clickedPath}
          then={() => setClickedPath(null)}
        />
      )}

      <Stack direction="row" alignItems="flex-end" sx={{ width: 1 }}>
        {editing ? (
          <EditEntity />
        ) : (
          <Stack sx={{ opacity: collapsed ? 0.5 : undefined }}>
            <Typography
              sx={{ ...font, fontSize: entity.section ? 22 : font.fontSize }}
            >
              {entity.text ?? "No content"}
            </Typography>
          </Stack>
        )}
        {hasHiddenChildren ? (
          <MoreHorizIcon
            fontSize="small"
            sx={{ color: colours.tx2, paddingLeft: 1 }}
          />
        ) : null}
      </Stack>

      {(entity.image ?? []).map((image) => (
        <RenderImage
          key={image.note + "__" + image.name}
          entityId={path == null ? undefined : entityId}
          note={image.note}
          name={image.name}
        />
      ))}
    </Stack>
  );
};

const EntityContentClicked = ({
  path,
  then,
}: {
  path: string[];
  then: () => void;
}) => {
  const selection = cursor(cursor(useTabState(), "frame"), "selection");

  useEffect(() => {
    selection.reset(path);
    then();
  }, [path, then, selection]);

  return null;
};

const EntityChildren = ({
  resolvedQueryChildren,
  selectionPointer,
  createEntityPointer,
  editEntityPointer,
}: {
  resolvedQueryChildren: { key: string; value: ResolvedQuery }[];
  selectionPointer: string[] | null;
  createEntityPointer: string[] | null;
  editEntityPointer: string[] | null;
}) => {
  const selectionPointerParts = headTail(selectionPointer ?? []);
  const createEntityPointerParts = headTail(createEntityPointer ?? []);
  const editEntityPointerParts = headTail(editEntityPointer ?? []);

  return (
    <>
      {resolvedQueryChildren.map((child) => (
        <Entity
          resolvedQuery={child.value}
          key={child.key}
          selectionPointer={
            child.key === selectionPointerParts.head
              ? selectionPointerParts.tail
              : null
          }
          createEntityPointer={
            child.key === createEntityPointerParts.head
              ? createEntityPointerParts.tail
              : null
          }
          editEntityPointer={
            child.key === editEntityPointerParts.head
              ? editEntityPointerParts.tail
              : null
          }
        />
      ))}
    </>
  );
};
