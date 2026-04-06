import { useCallback } from "react";
import { arrayCursor, cursor } from "../../helpers/atoms";
import { clamp } from "../../helpers/maths";
import { useTabGroupData } from "../tab-group-hooks";
import { useTabsState } from "../tabs-hooks";
import { generateUuid } from "../../helpers/uuid";

export const useOpenEntityInNewTab = () => {
  const tabs = useTabsState();
  const tabGroup = arrayCursor(
    cursor(tabs, "tabGroups"),
    clamp(tabs.value.selectedIndex, 0, tabs.value.tabGroups.length - 1),
  );
  const { openTab } = useTabGroupData(tabGroup);

  return useCallback(
    (entityId: string, then?: () => void) => {
      openTab({
        uuid: generateUuid(),
        frame: { entityId, selection: [], context: null, highlight: {} },
        collapsed: [],
      });
      then?.();
    },
    [openTab],
  );
};
