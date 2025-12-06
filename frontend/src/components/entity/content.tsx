import { Stack, Typography } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { EditEntity } from "../tool/edit-entity";
import { colours, font, invertColour } from "../../constants";
import { RenderImage } from "../common/image";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { cursor } from "../../helpers/atoms";
import { useTabState } from "../tab";
import { ResolvedQuery } from "../pensive";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { CopyButton } from "../common/copy-button";

export const EntityContent = ({
  resolvedQuery: {
    selected,
    path,
    collapsed,
    entity,
    entityId,
    hasHiddenChildren,
    editEntity,
  },
}: {
  resolvedQuery: ResolvedQuery;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [clickedPath, setClickedPath] = useState<string[] | null>(null);

  useEffect(() => {
    if (selected) {
      if (ref.current != null) {
        // Cast the element to avoid an undefined reference error on the method
        (
          ref.current as unknown as { scrollIntoViewIfNeeded: () => void }
        ).scrollIntoViewIfNeeded();
      }
    }
  }, [selected]);

  return (
    <Stack
      sx={{
        backgroundColor: selected ? invertColour("lightblue") : undefined,
        transition: "background-color 0.15s ease",
        "&:hover":
          path == null || selected ? {} : { backgroundColor: colours.bg2 },
        borderRadius: 1,
        paddingLeft: entity.llmContext == null ? 0.5 : 0.5,
        paddingRight: 0.5,
        cursor: "pointer",
        borderLeft:
          entity.llmContext == null ? null : `6px solid ${colours.ui2}`,
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
        {editEntity ? (
          <EditEntity />
        ) : (
          <Stack
            sx={{
              opacity: collapsed ? 0.5 : undefined,
              "@keyframes fadeInOut": {
                "0%": { opacity: 0.2 },
                "50%": { opacity: 1.0 },
                "100%": { opacity: 0.2 },
              },
              animation:
                entity.llmContext != null && entity.text == null
                  ? "fadeInOut 2s ease-in-out infinite"
                  : null,
            }}
          >
            {entity.image != null && entity.text == null ? null : (
              <EntityText
                text={entity.text}
                section={entity.section}
                depth={path.length}
                defaultText={
                  entity.llmContext == null ? "No content" : "Generating..."
                }
              />
            )}
            {entity.image && collapsed ? (
              <Typography sx={font}>Image collapsed</Typography>
            ) : null}
          </Stack>
        )}
        {hasHiddenChildren ? (
          <MoreHorizIcon
            fontSize="small"
            sx={{ color: colours.tx2, paddingLeft: 1 }}
          />
        ) : null}
      </Stack>

      {entity.image && !collapsed ? (
        <RenderImage resourceUuid={entityId} />
      ) : null}
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

// Needs to me memoised to prevent markdown from breaking text selection
const EntityText = memo(
  ({
    text,
    section,
    depth,
    defaultText,
  }: {
    text?: string | null;
    section?: boolean | null;
    depth: number;
    defaultText?: string;
  }) => {
    return (
      <Stack sx={{ ...font }}>
        <Markdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            a: (content) => (
              <a
                onClick={(event) => {
                  const isModifierPressed = event.ctrlKey || event.metaKey;

                  if (isModifierPressed) {
                    return true;
                  } else {
                    event.preventDefault();
                    return false;
                  }
                }}
                href={content.href}
              >
                {content.children}
              </a>
            ),
            p: ({ children }) => (
              <Typography
                component="p"
                display="inline"
                sx={{
                  ...font,
                  ...(section
                    ? {
                        fontSize:
                          font.fontSize *
                          Math.max(1.6 * Math.pow(0.9, depth), 1.1),
                        fontWeight: font.fontWeight * 1.5,
                      }
                    : {}),
                }}
              >
                {children}
              </Typography>
            ),
            code: ({ children }) => {
              const inline =
                typeof children === "string" && children.includes("\n");
              const text = (
                <Typography
                  variant="body1Monospace"
                  sx={
                    inline
                      ? {}
                      : {
                          backgroundColor: colours.ui,
                          padding: 0.3,
                          borderRadius: 1,
                        }
                  }
                >
                  {children}
                </Typography>
              );

              return inline ? (
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  gap={1}
                  sx={{
                    backgroundColor: colours.ui,
                    padding: 1,
                    borderRadius: 1,
                    marginY: 0.5,
                  }}
                >
                  {text}

                  <CopyButton
                    onClick={() =>
                      // Remove the trailing new line, which occurs before the
                      // closing backticks
                      navigator.clipboard.writeText(children.slice(0, -1))
                    }
                  />
                </Stack>
              ) : (
                text
              );
            },
          }}
        >
          {text ?? defaultText}
        </Markdown>
      </Stack>
    );
  }
);
