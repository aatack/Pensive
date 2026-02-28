import { arrayCursor, Atom, cursor } from "../helpers/atoms";
import { clamp } from "../helpers/maths";
import { TabState } from "./tab";
import { moveTab, useTabsState } from "./tabs";

export type TabGroupState = {
  tabs: TabState[];
  selectedIndex: number;
};

export type TabGroupData = {
  selectedTab: Atom<TabState>;
  selectNextTab: () => void;
  selectPreviousTab: () => void;
  closeTab: (tabUuid: string) => void;
  openTab: (tab: TabState) => void;
  incrementTabGroup: () => void;
  decrementTabGroup: () => void;
};

export const useTabGroupData = (
  tabGroup: Atom<TabGroupState>,
): TabGroupData => {
  const selectedIndex = clamp(
    tabGroup.value.selectedIndex,
    0,
    tabGroup.value.tabs.length - 1,
  );

  const tabs = useTabsState();
  const selectedTab = arrayCursor(cursor(tabGroup, "tabs"), selectedIndex);

  return {
    selectedTab,
    selectNextTab: () =>
      tabGroup.swap((current) => ({
        ...current,
        selectedIndex:
          selectedIndex >= current.tabs.length - 1
            ? 0
            : current.selectedIndex + 1,
      })),
    selectPreviousTab: () =>
      tabGroup.swap((current) => ({
        ...current,
        selectedIndex:
          selectedIndex > 0
            ? current.selectedIndex - 1
            : current.tabs.length - 1,
      })),
    closeTab: (tabUuid) =>
      tabGroup.swap((current) => ({
        ...current,
        tabs: current.tabs.filter((tab) => tab.uuid !== tabUuid),
      })),
    openTab: (tab) =>
      tabGroup.swap((current) => ({
        ...current,
        tabs: [...current.tabs, tab],
        selectedIndex: current.tabs.length,
      })),
    incrementTabGroup: () =>
      tabs.swap((current) =>
        moveTab(current, selectedTab.value.uuid, (index) => index + 1),
      ),
    decrementTabGroup: () =>
      tabs.swap((current) =>
        moveTab(current, selectedTab.value.uuid, (index) => index - 1),
      ),
  };
};

export const getFocusedTab = (tabGroup: TabGroupState) =>
  tabGroup.tabs[
    clamp(tabGroup.selectedIndex, 0, tabGroup.tabs.length - 1)
  ] as TabState;
