import { Grid } from "@mui/material";
import { Stack } from "@mui/system";
import { colours } from "../constants";
import {
  arrayCursors,
  Atom,
  cursor,
  useAtom,
  usePersistentAtom,
} from "../helpers/atoms";
import { clamp } from "../helpers/maths";
import { generateUuid } from "../helpers/uuid";
import { Provide, useProvided } from "../providers/provider";
import { StatusBar } from "./status-bar";
import { getFocusedTab, TabGroup, TabGroupState } from "./tab-group";
import { PasteImage } from "./common/image";
import { getFocusedEntityId, TabState } from "./tab";
import { useMetadata } from "./pensive";
import { DebugEntity } from "./entity/debug-entity";
import { useHotkey } from "../providers/hotkeys";
import { EditHotkeys } from "./settings/edit-hotkeys";

export type TabsState = {
  tabGroups: TabGroupState[];
  selectedIndex: number;
};

export type TabsData = {
  selectedIndex: number;
  selectNextTabGroup: () => void;
  selectPreviousTabGroup: () => void;
};

const useTabsData = (tabs: Atom<TabsState>) => {
  const selectedIndex = clamp(
    tabs.value.selectedIndex,
    0,
    tabs.value.tabGroups.length - 1
  );

  return {
    selectedIndex,
    selectNextTabGroup: () =>
      tabs.swap((current) => ({
        ...current,
        selectedIndex: selectedIndex + 1,
      })),
    selectPreviousTabGroup: () =>
      tabs.swap((current) => ({
        ...current,
        selectedIndex: selectedIndex - 1,
      })),
  };
};

const useTabsActions = (tabs: Atom<TabsState>, tabsData: TabsData) => {
  const { selectNextTabGroup, selectPreviousTabGroup } = tabsData;

  useHotkey("selectNextTabGroup", selectNextTabGroup);
  useHotkey("selectPreviousTabGroup", selectPreviousTabGroup);
};

export const defaultTabsState: TabsState = { tabGroups: [], selectedIndex: 0 };

export const useTabsState = () => useProvided("tabs");

export const Tabs = () => {
  const tabs = usePersistentAtom("tabsState", defaultTabsState, {
    verify: useVerifyTabs(),
  });
  const tabsData = useTabsData(tabs);
  useTabsActions(tabs, tabsData);

  const tabGroups = cursor(tabs, "tabGroups");

  const debugEntity = useAtom<string | null>(null);
  useHotkey("debugEntity", () =>
    debugEntity.reset(
      getFocusedEntityId(getFocusedTab(getFocusedTabGroup(tabs.value)))
    )
  );

  const showSettings = useAtom(false);

  return (
    <Provide values={{ tabs }}>
      <PasteImage
        entityUuid={getFocusedEntityId(
          getFocusedTab(getFocusedTabGroup(tabs.value))
        )}
      >
        <Stack sx={{ height: "100vh" }}>
          {debugEntity.value == null ? null : (
            <DebugEntity
              entityUuid={debugEntity.value}
              close={() => debugEntity.reset(null)}
            />
          )}

          {showSettings.value ? (
            <EditHotkeys />
          ) : (
            <Grid
              container
              sx={{
                backgroundColor: colours.bg,
                color: colours.tx,
                flexGrow: 1,
                overflowY: "clip",
              }}
            >
              {arrayCursors(tabGroups).map((tabGroup, index) => (
                <Grid
                  key={index}
                  item
                  xs={12 / tabGroups.value.length}
                  sx={{ height: 1, pr: 0 }}
                >
                  <TabGroup
                    tabGroup={tabGroup}
                    selected={index === tabsData.selectedIndex}
                    select={() =>
                      tabs.swap((current) => ({
                        ...current,
                        selectedIndex: index,
                      }))
                    }
                    lastGroup={index === tabGroups.value.length - 1}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          <StatusBar showSettings={showSettings} />
        </Stack>
      </PasteImage>
    </Provide>
  );
};

export const moveTab = (
  tabs: TabsState,
  tabUuid: string,
  updateTabGroupIndex: (index: number) => number
): TabsState => {
  const currentTab = tabs.tabGroups
    .flatMap((tabGroup, index) => tabGroup.tabs.map((tab) => ({ index, tab })))
    .find((item) => item.tab.uuid === tabUuid);

  if (currentTab == null) {
    return tabs;
  } else {
    const newIndex = clamp(
      updateTabGroupIndex(currentTab.index),
      0,
      tabs.tabGroups.length
    );

    return {
      ...tabs,
      tabGroups: [
        ...tabs.tabGroups,
        ...(newIndex === tabs.tabGroups.length
          ? [{ tabs: [], selectedIndex: 0 }]
          : []),
      ]
        .map((tabGroup) => ({
          ...tabGroup,
          tabs: tabGroup.tabs.filter((tab) => tab.uuid !== tabUuid),
        }))
        .map((tabGroup, index) =>
          index === newIndex
            ? {
                ...tabGroup,
                tabs: [...tabGroup.tabs, currentTab.tab],
                selectedIndex: tabGroup.tabs.length,
              }
            : tabGroup
        ),
      selectedIndex: newIndex,
    };
  }
};

export const getFocusedTabGroup = (tabs: TabsState) =>
  tabs.tabGroups[clamp(tabs.selectedIndex, 0, tabs.tabGroups.length - 1)]!;

const useVerifyTabs = () => {
  const metadata = useMetadata();

  return (tabs: TabsState): TabsState => {
    const tabGroups = tabs.tabGroups.filter(
      (tabGroup) => tabGroup.tabs.length > 0
    );
    return {
      ...tabs,
      tabGroups:
        tabGroups.length === 0
          ? [
              {
                tabs: [
                  {
                    uuid: generateUuid(),
                    frame: {
                      entityId: metadata.root,
                      selection: [],
                      context: null,
                      highlight: {},
                    },
                    collapsed: [],
                    expanded: [],
                  },
                ],
                selectedIndex: 0,
              },
            ]
          : tabGroups,
    };
  };
};

export const mapTabs = (
  tabs: TabsState,
  tabFunction: (tab: TabState) => TabState
): TabsState => ({
  ...tabs,
  tabGroups: tabs.tabGroups.map((tabGroup) => ({
    ...tabGroup,
    tabs: tabGroup.tabs.map(tabFunction),
  })),
});

export const getTab = (tabs: TabsState, tabUuid: string) =>
  tabs.tabGroups
    .flatMap((group) => group.tabs)
    .find((tab) => tab.uuid === tabUuid) ?? null;

export const duplicateTab = (tabs: TabsState, tabUuid: string): TabsState => ({
  ...tabs,
  tabGroups: tabs.tabGroups.map((tabGroup) => ({
    ...tabGroup,
    tabs: tabGroup.tabs.map((tab) => tab.uuid).includes(tabUuid)
      ? [
          ...tabGroup.tabs,
          {
            ...tabGroup.tabs.find((tab) => tab.uuid === tabUuid)!,
            uuid: generateUuid(),
          },
        ]
      : tabGroup.tabs,
  })),
});
