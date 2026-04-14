import { useEntity } from "../../context/hooks";
import { nextInCycle } from "../../helpers/arrays";
import { Atom, cursor } from "../../helpers/atoms";
import { useHotkey } from "../../providers/use-hotkey";
import { LinkType } from "../../queries/types";
import { TabState } from "../tab-hooks";

export const usePivots = (
  entityId: string,
  tab: Atom<TabState>,
  enabled: boolean,
) => {
  const entity = useEntity(entityId);
  const pivots = cursor(cursor(tab, "frame"), "pivots");

  const keys: (LinkType | null)[] = [
    ...(["inbound", "outbound"] as const).filter((key) => entity[key] != null),
    null,
  ];

  useHotkey(
    "pivotEntity",
    () => {
      pivots.swap((current) => ({
        ...current,
        [entityId]: nextInCycle(keys, current?.[entityId] ?? null),
      }));
    },
    { enabled },
  );
};

export const useNestedQueries = (
  entityId: string,
  tab: Atom<TabState>,
  enabled: boolean,
) => {
  const nestedQueries = cursor(cursor(tab, "frame"), "nestedQueries");

  useHotkey(
    "nestedQuery",
    () => {
      nestedQueries.swap((current) => ({
        ...current,
        [entityId]: [],
      }));
    },
    { enabled, preventDefault: true },
  );
};
