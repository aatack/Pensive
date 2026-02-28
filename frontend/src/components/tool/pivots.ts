import { useEntity } from "../../context/hooks";
import { nextInCycle } from "../../helpers/arrays";
import { Atom, cursor } from "../../helpers/atoms";
import { useHotkey } from "../../providers/hotkeys";
import { EntityLinkKey } from "../entity/entity";
import { TabState } from "../tab";

export const usePivots = (
  entityId: string,
  tab: Atom<TabState>,
  enabled: boolean
) => {
  const entity = useEntity(entityId);
  const pivots = cursor(cursor(tab, "frame"), "pivots");

  const keys: (EntityLinkKey | null)[] = [
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
    { enabled }
  );
};
