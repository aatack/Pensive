import { Box, Stack, Typography } from "@mui/material";
import { arrayCursor, Atom, cursor } from "../helpers/atoms";
import { clamp } from "../helpers/maths";
import { Tab, TabState } from "./tab";
import CircleIcon from "@mui/icons-material/Circle";
import { WindowControls } from "./window-controls";
import { colours, font } from "../constants";
import { generateUuid } from "../helpers/uuid";
import { moveTab, useTabsState } from "./tabs";
import { useEntity } from "../context/hooks";
import { useMetadata } from "./pensive";
import { useHotkey } from "../providers/hotkeys";

const padding = "4px";

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

const useTabGroupData = (tabGroup: Atom<TabGroupState>): TabGroupData => {
  const selectedIndex = clamp(
    tabGroup.value.selectedIndex,
    0,
    tabGroup.value.tabs.length - 1
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
        moveTab(current, selectedTab.value.uuid, (index) => index + 1)
      ),
    decrementTabGroup: () =>
      tabs.swap((current) =>
        moveTab(current, selectedTab.value.uuid, (index) => index - 1)
      ),
  };
};

const useTabGroupActions = (
  tabGroup: Atom<TabGroupState>,
  selected: boolean
) => {
  const tabGroupData = useTabGroupData(tabGroup);
  const metadata = useMetadata();

  useHotkey(
    "closeTab",
    () => tabGroupData.closeTab(tabGroupData.selectedTab.value.uuid),
    {
      preventDefault: true,
      enabled: selected,
    }
  );
  useHotkey(
    "openTab",
    () =>
      tabGroupData.openTab({
        uuid: generateUuid(),
        frame: {
          entityId: metadata.root,
          selection: [],
          context: null,
          highlight: {},
        },
        collapsed: [],
        expanded: [],
      }),
    {
      preventDefault: true,
      enabled: selected,
    }
  );
  useHotkey("selectNextTab", () => tabGroupData.selectNextTab(), {
    enabled: selected,
  });
  useHotkey("selectPreviousTab", () => tabGroupData.selectPreviousTab(), {
    enabled: selected,
  });

  useHotkey("incrementTabGroup", tabGroupData.incrementTabGroup, {
    enabled: selected,
  });
  useHotkey("decrementTabGroup", tabGroupData.decrementTabGroup, {
    enabled: selected,
  });

  useHotkey(
    "popFrameIntoTab",
    () =>
      tabGroup.swap((current) =>
        popFrameIntoTab(current, tabGroupData.selectedTab.value.uuid)
      ),
    { enabled: selected }
  );
};

export const TabGroup = ({
  tabGroup,
  selected,
  select,
  lastGroup,
  groupsLeft,
  groupsRight,
}: {
  tabGroup: Atom<TabGroupState>;
  selected: boolean;
  select: () => void;
  lastGroup: boolean;
  groupsLeft?: number;
  groupsRight?: number;
}) => {
  const { selectedTab } = useTabGroupData(tabGroup);
  useTabGroupActions(tabGroup, selected);

  return (
    <Stack sx={{ height: 1 }} onClick={select}>
      <TabHeaders
        tabGroup={tabGroup}
        selected={selected}
        select={select}
        lastGroup={lastGroup}
        groupsLeft={groupsLeft}
        groupsRight={groupsRight}
      />

      {tabGroup.value.tabs.length > 0 && (
        <Tab
          key={selectedTab.value.uuid}
          tab={selectedTab}
          selected={selected}
        />
      )}
    </Stack>
  );
};

const TabHeaders = ({
  tabGroup,
  selected,
  select,
  lastGroup,
  groupsLeft,
  groupsRight,
}: {
  tabGroup: Atom<TabGroupState>;
  selected: boolean;
  select: () => void;
  lastGroup: boolean;
  groupsLeft?: number;
  groupsRight?: number;
}) => {
  const { selectedTab } = useTabGroupData(tabGroup);
  const uuids = tabGroup.value.tabs.map((tab) => tab.uuid);

  return (
    <Stack
      direction="row"
      sx={{
        width: 1,
        backgroundColor: colours.tx2,
        pt: padding,
        mr: 1,
      }}
      alignItems="center"
      onClick={select}
    >
      <CircleIcon
        sx={{
          opacity: selected ? 1 : 0.5,
          fontSize: 14,
          px: 1,
          pr: 0.5,
          color: colours.bl,
        }}
      />

      {groupsLeft ? <Typography>+{groupsLeft}</Typography> : null}

      {tabGroup.value.tabs.map((tab) => (
        <TabHeader
          key={tab.uuid}
          tab={tab}
          selected={selectedTab.value.uuid === tab.uuid}
          tabGroup={tabGroup}
          uuids={uuids}
        />
      ))}

      {groupsRight ? <Typography>+{groupsRight}</Typography> : null}

      {lastGroup ? <WindowControls /> : null}
    </Stack>
  );
};

const TabHeader = ({
  tab,
  selected,
  tabGroup,
  uuids,
}: {
  tab: TabState;
  selected: boolean;
  tabGroup: Atom<TabGroupState>;
  uuids: string[];
}) => {
  const entity = useEntity(tab.frame.entityId);

  return (
    <Box
      sx={{
        pb: padding,
        backgroundColor: colours.bg,
        px: 1,
        width: 150,
        ml: padding,
        pt: padding,
        borderRadius: "4px 4px 0px 0px",
        opacity: selected ? 1 : 0.7,
        cursor: selected ? undefined : "pointer",
      }}
      onClick={() =>
        tabGroup.swap((current) => ({
          ...current,
          selectedIndex: uuids.indexOf(tab.uuid),
        }))
      }
    >
      <Typography sx={{ ...font }} noWrap>
        {entity.text ?? "No content"}
      </Typography>
    </Box>
  );
};

const popFrameIntoTab = (
  tabGroup: TabGroupState,
  tabUuid: string
): TabGroupState => {
  const frame = tabGroup.tabs.find((tab) => tab.uuid === tabUuid)?.frame;

  if (frame == null || frame.context == null) {
    return tabGroup;
  } else {
    return {
      ...tabGroup,
      tabs: [
        ...tabGroup.tabs.map((tab) =>
          tab.uuid === tabUuid ? { ...tab, frame: frame.context! } : tab
        ),
        {
          uuid: generateUuid(),
          frame: { ...frame, context: null },
          collapsed: [],
          expanded: [],
        },
      ],
      selectedIndex: tabGroup.tabs.length,
    };
  }
};

export const getFocusedTab = (tabGroup: TabGroupState) =>
  tabGroup.tabs[clamp(tabGroup.selectedIndex, 0, tabGroup.tabs.length - 1)]!;
