import { Box, Divider } from "@mui/material";
import { useEntity, useSwapEntity, useWrite } from "../context/hooks";
import { butLast, last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { Provide, useProvided } from "../providers/provider";
import { useToolState } from "./tool/tool";
import { Entity } from "./entity/entity";
import { EntityIndent } from "./entity/indent";
import { EntityContent } from "./entity/content";
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
import { useConnectEntityActions } from "./tool/connect-entities";
import { useHotkey } from "../providers/hotkeys";

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
    useFrameNavigation(
      frame,
      tab.value.collapsed,
      tab.value.expanded,
      tab.value.uuid
    );

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
  const write = useWrite();

  useHotkey("selectParent", tabData.selectParent, { enabled: selected });
  useHotkey("selectFollowing", tabData.selectFollowing, { enabled: selected });
  useHotkey("selectPreceding", tabData.selectPreceding, { enabled: selected });

  useHotkey(
    "removeConnection",
    () => {
      const path = [tab.value.frame.entityId, ...tab.value.frame.selection];
      if (path.length >= 2) {
        tabData.selectPreceding();
        const parentUuid = path[path.length - 2]!;
        const childUuid = path[path.length - 1]!;
        write({
          [parentUuid]: { outbound: `-${childUuid}` },
          [childUuid]: { inbound: `-${parentUuid}` },
        });
      }
    },
    { enabled: selected }
  );

  useHotkey("pushFrame", tabData.pushFrame, { enabled: selected });
  useHotkey("popFrame", tabData.popFrame, { enabled: selected });

  useCreateEntityActions(tab.value, selected);
  useEditEntityActions(tab.value, selected);
  useMoveEntityActions(tab.value, selected);
  useConnectEntityActions(tab.value, selected);
  useCollapsedExpandedActions(tab, selected);

  const entityId = last(tab.value.frame.selection) ?? tab.value.frame.entityId;

  useHotkey(
    "toggleSection",
    () =>
      swapEntity(entityId, (current) => ({
        section: current.section ? null : true,
      })),
    { enabled: selected, preventDefault: true }
  );
  useHotkey(
    "toggleOpen",
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
  const ref = useRef<HTMLDivElement>();

  const tabData = useTabActions(tab, selected);

  useEffect(() => {
    // Restore the scroll position when the tab is brought back into view
    if (ref.current && tab.value.scrollPosition !== undefined) {
      ref.current.scrollTop = tab.value.scrollPosition;
    }
  }, [ref]);

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

        <Entity resolvedQuery={tabData.resolvedQuery} />
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
  const entity = useEntity(entityId);
  return (
    <EntityIndent entity={entity}>
      <EntityContent
        resolvedQuery={{
          entity,
          entityId,
          path: [],
          children: [],
          highlight: true,
          collapsed: false,
          hasHiddenChildren: false,
          selected: false,
          createEntity: false,
          editEntity: false,
        }}
      />
    </EntityIndent>
  );
};

export const getFocusedEntityId = (tab: TabState) =>
  last(tab.frame.selection) ?? tab.frame.entityId;

const useFrameNavigation = (
  frame: Atom<FrameState>,
  collapsed: string[],
  expanded: string[],
  tabUuid: string
) => {
  const pensive = usePensive();
  const tool = useToolState().value;

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
      limit,
      [],
      frame.value.selection,
      tool?.type === "createEntity" && tool.tabUuid === tabUuid
        ? tool.path
        : null,
      tool?.type === "editEntity" && tool.tabUuid === tabUuid ? tool.path : null
    );
    return [resolvedQuery, flattenResolvedQuery(resolvedQuery)];
  }, [
    pensive.value.entities,
    frame.value.entityId,
    frame.value.highlight,
    frame.value.selection,
    collapsed,
    expanded,
    tool,
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
  useHotkey(
    "collapseEntity",
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
  useHotkey(
    "expandEntity",
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
