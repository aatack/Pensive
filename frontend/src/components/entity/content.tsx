import { Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { EditEntity } from "../tool/edit-entity";
import { colours, font } from "../../constants";
import { RenderImage } from "../common/image";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { EntityState } from "./entity";
import { cursor } from "../../helpers/atoms";
import { useTabState } from "../tab";

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
export const EntityContentClicked = ({
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
