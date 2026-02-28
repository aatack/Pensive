import { butLast, last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { useProvided } from "../providers/use-provided";
import { useToolState } from "./tool/tool";
import { EntityLinkKey } from "./entity/entity";
import { useMemo } from "react";
import {
  findQueryResolutionLimit,
  flattenResolvedQuery,
  ResolvedQuery,
  resolveQuery,
  usePensive,
} from "./pensive";
import {
  flattenQuery,
  resolveQuery as newResolveQuery,
} from "../queries/queries";

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
    snoozed?: boolean;
  };

  pivots?: {
    [entityId: string]: EntityLinkKey | null;
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

export const useTabData = (tab: Atom<TabState>): TabData => {
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
      tab.value.uuid,
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

export const getFocusedEntityId = (tab: TabState) =>
  last(tab.frame.selection) ?? tab.frame.entityId;

export const useResolvedQuery = (
  frame: Atom<FrameState>,
  collapsed: string[],
  expanded: string[],
  tabUuid: string,
) => {
  const pensive = usePensive();
  const tool = useToolState().value;

  const { data: resolvedQuery, ids } = useMemo(
    () =>
      newResolveQuery({
        query: { type: "links", key: "outbound" },
        entityId: frame.value.entityId,
        collapsed: {},
        overrides: {},
        lookup: pensive.value.entities,
        path: [],
      }),
    [frame.value.entityId, pensive.value.entities],
  );

  const flattenedResolvedQuery = useMemo(
    () => flattenQuery(resolvedQuery, []),
    [resolvedQuery],
  );

  return useMemo(
    () => ({ resolvedQuery, flattenedResolvedQuery, ids }),
    [resolvedQuery, flattenedResolvedQuery, ids],
  );
};

const useFrameNavigation = (
  frame: Atom<FrameState>,
  collapsed: string[],
  expanded: string[],
  tabUuid: string,
) => {
  const pensive = usePensive();
  const tool = useToolState().value;

  const [resolvedQuery, flattenedQuery] = useMemo(() => {
    const limit = findQueryResolutionLimit(
      pensive.value.entities,
      frame.value.entityId,
      200,
      frame.value.pivots ?? {},
    );

    const timestamp = new Date();

    const resolvedQuery = resolveQuery(
      pensive.value.entities,
      frame.value.entityId,
      (entity) =>
        (entity.text ?? "")
          .toLowerCase()
          .includes((frame.value.highlight.text ?? "").toLowerCase()) &&
        Boolean(!frame.value.highlight.section || entity.section) &&
        (entity.snoozed == null ||
          new Date(entity.snoozed) < timestamp ||
          Boolean(frame.value.highlight.snoozed)),
      collapsed,
      expanded,
      limit,
      [],
      frame.value.selection,
      tool?.type === "createEntity" && tool.tabUuid === tabUuid
        ? tool.path
        : null,
      tool?.type === "editEntity" && tool.tabUuid === tabUuid
        ? tool.path
        : null,
      frame.value.pivots ?? {},
      null,
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
    frame.value.pivots,
  ]);

  // Everything is joined with double underscores because you can't use arrays
  // as dictionary keys
  const index = flattenedQuery.indexOf(
    [frame.value.entityId, ...frame.value.selection].join("__"),
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
