import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { Tab } from "./tab";
import CircleIcon from "@mui/icons-material/Circle";
import { WindowControls } from "./window-controls";
import { colours, font } from "../constants";
import { generateUuid } from "../helpers/uuid";
import { useEntity } from "../context/hooks";
import { useMetadata } from "./pensive";
import { useHotkey } from "../providers/use-hotkey";
import { TabGroupState, useTabGroupData } from "./tab-group-hooks";
import { Atom } from "../helpers/atoms";
import { TabState } from "./tab-hooks";
import { useTabRunning } from "./global-status/tab-running";

const padding = "4px";

const useTabGroupActions = (
  tabGroup: Atom<TabGroupState>,
  selected: boolean,
) => {
  const tabGroupData = useTabGroupData(tabGroup);
  const metadata = useMetadata();

  useHotkey(
    "closeTab",
    () => tabGroupData.closeTab(tabGroupData.selectedTab.value.uuid),
    {
      preventDefault: true,
      enabled: selected,
    },
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
    },
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
        popFrameIntoTab(current, tabGroupData.selectedTab.value.uuid),
      ),
    { enabled: selected },
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

      {groupsLeft ? <MoreTabs count={groupsLeft} /> : null}

      {tabGroup.value.tabs.map((tab) => (
        <TabHeader
          key={tab.uuid}
          tab={tab}
          selected={selectedTab.value.uuid === tab.uuid}
          tabGroup={tabGroup}
          uuids={uuids}
        />
      ))}

      {groupsRight ? (
        <Stack sx={{ mx: 0.5 }}>
          <MoreTabs count={groupsRight} />
        </Stack>
      ) : null}

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
  const running = useTabRunning(tab.uuid);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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

      {running && <CircularProgress size={14} sx={{ ml: 1 }} />}
    </Box>
  );
};

const MoreTabs = ({ count }: { count: number }) => {
  return (
    <Typography sx={{ px: 1, backgroundColor: colours.ui3, borderRadius: 2 }}>
      +{count}
    </Typography>
  );
};

const popFrameIntoTab = (
  tabGroup: TabGroupState,
  tabUuid: string,
): TabGroupState => {
  const frame = tabGroup.tabs.find((tab) => tab.uuid === tabUuid)?.frame;
  const frameContext = frame?.context;

  if (frame == null || frameContext == null) {
    return tabGroup;
  } else {
    return {
      ...tabGroup,
      tabs: [
        ...tabGroup.tabs.map((tab) =>
          tab.uuid === tabUuid ? { ...tab, frame: frameContext } : tab,
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
