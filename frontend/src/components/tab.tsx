import { Box, Divider } from "@mui/material";
import { useHotkeys } from "react-hotkeys-hook";
import { useEntity, useSwapEntity } from "../context/hooks";
import { butLast, last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { Provide, useProvided } from "../providers/provider";
import { useToolState } from "./tool/tool";
import { Entity, EntityContent, EntityIndent } from "./entity";
import { useEffect, useMemo, useRef } from "react";
import {
  findQueryResolutionLimit,
  flattenResolvedQuery,
  ResolvedQuery,
  resolveQuery,
  usePensive,
} from "./pensive";
import { useCreateEntityActions } from "./tool/create-entity";
import { useEditEntityActions } from "./tool/edit-entity";
import { useMoveEntityActions } from "./tool/move-entity";

export type TabState = {
  uuid: string;
  frame: FrameState;

  // IDs of entities that have their children either always rendered or never
  // rendered
  collapsed: string[];
  expanded: string[];

  // Stored so that the scroll position is maintained when the tab is overlaid
  // by another tab, or otherwise disappears
  scrollPosition?: number;
};

export type FrameState = {
  entityId: string;
  selection: string[];
  context: FrameState | null;

  // Specifies entities that should be highlighted, while others are hidden
  highlight: {
    text?: string;
    section?: boolean;
  };
};

export type TabData = {
  resolvedQuery: ResolvedQuery;
  select: (path: string[] | null) => void;
  selectParent: () => void;
  selectFollowing: () => void;
  selectPreceding: () => void;
  pushFrame: () => void;
  popFrame: () => void;
};

export const useTabState = () => useProvided("tab");

const useTabData = (tab: Atom<TabState>): TabData => {
  const frame = cursor(tab, "frame");

  const select = (path: string[] | null) =>
    frame.swap((current) => ({
      ...current,
      selection: path ?? current.selection,
    }));

  const { selectParent, selectFollowing, selectPreceding, resolvedQuery } =
    useFrameNavigation(frame, tab.value.collapsed, tab.value.expanded);

  return {
    resolvedQuery,
    select,
    selectParent,
    selectFollowing,
    selectPreceding,
    pushFrame: () =>
      tab.swap((current) => {
        const entityId = last(current.frame.selection);
        return entityId == null
          ? current
          : ({
              ...current,
              frame: {
                entityId,
                selection: [],
                context: current.frame,
                highlight: {},
              },
            } as TabState);
      }),
    popFrame: () =>
      tab.swap((current) => {
        const context = current.frame.context;
        return context == null ? current : { ...current, frame: context };
      }),
  };
};

const useTabActions = (tab: Atom<TabState>, selected: boolean) => {
  const tabData = useTabData(tab);

  const swapEntity = useSwapEntity();

  useHotkeys("a", tabData.selectParent, { enabled: selected });
  useHotkeys("s", tabData.selectFollowing, { enabled: selected });
  useHotkeys("w", tabData.selectPreceding, { enabled: selected });

  useHotkeys(
    "delete,backspace",
    () => {
      tabData.selectPreceding();
      swapEntity(getFocusedEntityId(tab.value), (current) => ({
        ...current,
        parent: null,
      }));
    },
    { enabled: selected }
  );

  useHotkeys("d", tabData.pushFrame, { enabled: selected });
  useHotkeys("shift+a", tabData.popFrame, { enabled: selected });

  useCreateEntityActions(tab.value, selected);
  useEditEntityActions(tab.value, selected);
  useMoveEntityActions(tab.value, selected);
  useCollapsedExpandedActions(tab, selected);

  const entityId = last(tab.value.frame.selection) ?? tab.value.frame.entityId;

  useHotkeys(
    "ctrl+/",
    () =>
      swapEntity(entityId, (current) => ({
        section: current.section ? null : true,
      })),
    { enabled: selected, preventDefault: true }
  );
  useHotkeys(
    "shift+.",
    () =>
      swapEntity(entityId, (current) => ({
        open: current.open == null ? true : current.open ? false : null,
      })),
    { enabled: selected, preventDefault: true }
  );

  return tabData;
};

export const Tab = ({
  tab,
  selected,
}: {
  tab: Atom<TabState>;
  selected: boolean;
}) => {
  const frame = tab.value.frame;
  const ref = useRef<HTMLDivElement>();

  const tabData = useTabActions(tab, selected);

  useEffect(() => {
    // Restore the scroll position when the tab is brought back into view
    if (ref.current && tab.value.scrollPosition !== undefined) {
      ref.current.scrollTop = tab.value.scrollPosition;
    }
  }, [ref]);

  const tool = useToolState().value;

  return (
    <Provide values={{ tab: { ...tab, selected } }}>
      <Box
        ref={ref}
        sx={{ p: "4px", overflowY: "auto" }}
        onScroll={() => {
          const box = ref.current;
          if (box) {
            tab.swap((current) => ({
              ...current,
              scrollPosition: box.scrollTop,
            }));
          }
        }}
      >
        <TabContext tab={tab.value} />

        <Entity
          resolvedQuery={tabData.resolvedQuery}
          selectionPointer={frame.selection}
          createEntityPointer={
            tool?.type === "createEntity" && tool.tabUuid === tab.value.uuid
              ? tool.path
              : null
          }
          editEntityPointer={
            tool?.type === "editEntity" && tool.tabUuid === tab.value.uuid
              ? tool.path
              : null
          }
        />
      </Box>
    </Provide>
  );
};

const contextEntities = (frame: FrameState | null): string[] =>
  frame == null ? [] : [...contextEntities(frame.context), frame.entityId];

const TabContext = ({ tab }: { tab: TabState }) => {
  const entityIds = contextEntities(tab.frame.context);
  return entityIds.length === 0 ? null : (
    <>
      {entityIds.map((entityId) => (
        <TabContextEntity key={entityId} entityId={entityId} />
      ))}

      <Divider sx={{ m: 1 }} />
    </>
  );
};

const TabContextEntity = ({ entityId }: { entityId: string }) => {
  const entity = useEntity(entityId, null);
  return (
    <EntityIndent entity={entity}>
      <EntityContent entityId={entityId} entity={entity} selected={false} />
    </EntityIndent>
  );
};

export const getFocusedEntityId = (tab: TabState) =>
  last(tab.frame.selection) ?? tab.frame.entityId;

const useFrameNavigation = (
  frame: Atom<FrameState>,
  collapsed: string[],
  expanded: string[]
) => {
  const pensive = usePensive();

  const [resolvedQuery, flattenedQuery] = useMemo(() => {
    const limit = findQueryResolutionLimit(
      pensive.value.entities,
      frame.value.entityId,
      200
    );

    const resolvedQuery = resolveQuery(
      pensive.value.entities,
      frame.value.entityId,
      (entity) =>
        (entity.text ?? "")
          .toLowerCase()
          .includes((frame.value.highlight.text ?? "").toLowerCase()) &&
        Boolean(!frame.value.highlight.section || entity.section),
      collapsed,
      expanded,
      limit
    );
    return [resolvedQuery, flattenResolvedQuery(resolvedQuery)];
  }, [
    pensive.value.entities,
    frame.value.entityId,
    frame.value.highlight,
    collapsed,
    expanded,
  ]);

  // Everything is joined with double underscores because you can't use arrays
  // as dictionary keys
  const index = flattenedQuery.indexOf(
    [frame.value.entityId, ...frame.value.selection].join("__")
  );

  const selectIndex = (newIndex: number) => {
    const joinedPath = flattenedQuery[newIndex];
    if (joinedPath != null) {
      return frame.swap((current) => ({
        ...current,
        selection: joinedPath.split("__").slice(1),
      }));
    }
  };

  return {
    resolvedQuery,
    flattenedQuery,
    selectPreceding: () => selectIndex(index - 1),
    selectFollowing: () => selectIndex(index + 1),
    selectParent: () =>
      frame.swap((current) => ({
        ...current,
        selection: butLast(current.selection),
      })),
  };
};

const useCollapsedExpandedActions = (tab: Atom<TabState>, enabled: boolean) => {
  useHotkeys(
    "left",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;
      const expanded = tab.value.expanded.includes(entityId);

      return tab.swap((current) => ({
        ...current,
        collapsed: expanded
          ? current.collapsed
          : [
              ...current.collapsed.filter((item) => item !== entityId),
              entityId,
            ],
        expanded: expanded
          ? current.expanded.filter((item) => item !== entityId)
          : current.expanded,
      }));
    },
    { enabled }
  );
  useHotkeys(
    "right",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;

      const collapsed = tab.value.collapsed.includes(entityId);
      return tab.swap((current) => ({
        ...current,
        collapsed: collapsed
          ? current.collapsed.filter((item) => item !== entityId)
          : current.collapsed,
        expanded: collapsed
          ? current.expanded
          : [...current.expanded.filter((item) => item !== entityId), entityId],
      }));
    },
    { enabled }
  );
};
