import { butLast, last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { useProvided } from "../providers/use-provided";
import { EntityLinkKey } from "./entity/entity";
import { useCallback, useMemo } from "react";
import { usePensive } from "./pensive";
import {
  flattenQuery,
  resolveQuery,
  ResolvedQuery,
  FlattenedResolvedQuery,
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
  flattenedQuery: FlattenedResolvedQuery[];
  select: (path: string[] | null) => void;
  selectParent: () => void;
  selectFollowing: () => void;
  selectPreceding: () => void;
  selectedIndex: number;
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

  const {
    selectParent,
    selectFollowing,
    selectPreceding,
    resolvedQuery,
    flattenedQuery,
    index,
  } = useResolvedQuery(frame, tab.value.collapsed, tab.value.expanded);

  return {
    resolvedQuery,
    flattenedQuery,
    select,
    selectParent,
    selectFollowing,
    selectPreceding,
    selectedIndex: index,
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
) => {
  const pensive = usePensive();

  const { data: resolvedQuery, ids } = useMemo(() => {
    return resolveQuery({
      query: { type: "links", linkType: "outbound" },
      entityId: frame.value.entityId,
      collapsed: {
        ...Object.fromEntries(collapsed.map((id) => [id, true])),
        ...Object.fromEntries(expanded.map((id) => [id, false])),
      },
      overrides: {},
      lookup: pensive.value.entities,
      path: [],
    });
  }, [frame.value.entityId, pensive.value.entities, collapsed, expanded]);

  const flattenedQuery = useMemo(
    () => flattenQuery(resolvedQuery, []),
    [resolvedQuery],
  );

  // Everything is joined with double underscores because you can't use arrays
  // as dictionary keys
  const paths = useMemo(
    () => flattenedQuery.map((item) => item.path.join("__")),
    [flattenedQuery],
  );
  const index = useMemo(
    () => paths.indexOf(frame.value.selection.join("__")),
    [paths, frame.value.entityId, frame.value.selection],
  );

  const selectIndex = useCallback(
    (newIndex: number) => {
      const joinedPath = paths[newIndex];
      if (joinedPath != null) {
        return frame.swap((current) => ({
          ...current,
          selection: joinedPath.split("__"),
        }));
      }
    },
    [paths, frame.swap],
  );

  const selectPreceding = useCallback(
    () => selectIndex(index - 1),
    [selectIndex, index],
  );
  const selectFollowing = useCallback(
    () => selectIndex(index + 1),
    [selectIndex, index],
  );
  const selectParent = useCallback(
    () =>
      frame.swap((current) => ({
        ...current,
        selection: butLast(current.selection),
      })),
    [frame.swap],
  );

  return useMemo(
    () => ({
      resolvedQuery,
      flattenedQuery,
      ids,
      selectFollowing,
      selectPreceding,
      selectParent,
      index,
    }),
    [
      resolvedQuery,
      flattenedQuery,
      ids,
      selectFollowing,
      selectPreceding,
      selectParent,
      index,
    ],
  );
};
