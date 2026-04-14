import { butLast, last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { useProvided } from "../providers/use-provided";
import { EntityLinkKey } from "./entity/entity";
import { useCallback, useMemo } from "react";
import {
  buildQueryFunction,
  flatten,
  FlattenedResult,
  Result,
  usePopulatedQuery,
} from "../queries/combined-query";

export type TabState = {
  uuid: string;
  frame: FrameState;

  // IDs of entities that have their children either always rendered or never
  // rendered
  collapsed: string[];

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
  result: Result;
  flattenedResult: FlattenedResult[];
  queriedEntities: Set<string>;
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
    result,
    flattenedResult,
    index,
    queriedEntities,
  } = useQuery(frame, tab.value.collapsed);

  return {
    result,
    flattenedResult,
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
    queriedEntities,
  };
};

export const getFocusedEntityId = (tab: TabState) =>
  last(tab.frame.selection) ?? tab.frame.entityId;

export const useQuery = (frame: Atom<FrameState>, collapsed: string[]) => {
  const { result, ids: queriedEntities } = usePopulatedQuery(
    frame.value.entityId,
    useMemo(() => buildQueryFunction({ type: "link", links: "outbound" }), []),
    useMemo(
      () => ({
        ...Object.fromEntries(
          Object.entries(frame.value.pivots ?? {}).map(
            ([id, link]) =>
              [
                id,
                buildQueryFunction({ type: "link", links: link ?? undefined }),
              ] as const,
          ),
        ),
        ...Object.fromEntries(
          collapsed.map((id) => [id, buildQueryFunction({ type: "collapse" })]),
        ),
      }),
      [collapsed, frame.value.pivots],
    ),
    useCallback(
      (entity) =>
        (entity.text ?? "")
          .toLowerCase()
          .includes(frame.value.highlight.text?.toLowerCase() ?? "") &&
        (frame.value.highlight.section ? Boolean(entity.section) : true),
      [frame.value.highlight],
    ),
  );

  const flattenedResult = useMemo(() => flatten(result, []), [result]);

  // Everything is joined with double underscores because you can't use arrays
  // as dictionary keys
  const paths = useMemo(
    () => flattenedResult.map((item) => item.path.join("__")),
    [flattenedResult],
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
          selection: joinedPath === "" ? [] : joinedPath.split("__"),
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
      result,
      flattenedResult,
      queriedEntities,
      selectFollowing,
      selectPreceding,
      selectParent,
      index,
    }),
    [
      result,
      flattenedResult,
      queriedEntities,
      selectFollowing,
      selectPreceding,
      selectParent,
      index,
    ],
  );
};
