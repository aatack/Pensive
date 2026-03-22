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
import { Provide } from "../providers/provider";
import { StatusBar } from "./status-bar";
import { PasteImage } from "./common/image";
import { DebugEntity } from "./entity/debug-entity";
import { useHotkey } from "../providers/use-hotkey";
import { useRedo, useUndo } from "../context/hooks";
import {
  defaultTabsState,
  getFocusedTabGroup,
  TabsData,
  TabsState,
  useTabsData,
  useVerifyTabs,
} from "./tabs-hooks";
import { getFocusedTab } from "./tab-group-hooks";
import { getFocusedEntityId } from "./tab-hooks";
import { TabGroup } from "./tab-group";
import { SettingsPage } from "./settings/settings-page";

const useTabsActions = (tabs: Atom<TabsState>, tabsData: TabsData) => {
  const { selectNextTabGroup, selectPreviousTabGroup } = tabsData;
  const undo = useUndo();
  const redo = useRedo();

  useHotkey("selectNextTabGroup", selectNextTabGroup);
  useHotkey("selectPreviousTabGroup", selectPreviousTabGroup);
  useHotkey("maximiseTabGroup", () =>
    tabs.swap((current) => ({ ...current, maximised: !current.maximised })),
  );
  useHotkey("undo", undo, { preventDefault: true });
  useHotkey("redo", redo, { preventDefault: true });
};

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
      getFocusedEntityId(getFocusedTab(getFocusedTabGroup(tabs.value))),
    ),
  );

  const showSettings = useAtom(false);

  return (
    <Provide values={{ tabs }}>
      <PasteImage
        entityUuid={getFocusedEntityId(
          getFocusedTab(getFocusedTabGroup(tabs.value)),
        )}
      >
        <Stack sx={{ height: "100vh", backgroundColor: colours.bg }}>
          {debugEntity.value == null ? null : (
            <DebugEntity
              entityUuid={debugEntity.value}
              close={() => debugEntity.reset(null)}
            />
          )}

          {showSettings.value ? (
            <SettingsPage />
          ) : (
            <Grid
              container
              sx={{
                color: colours.tx,
                flexGrow: 1,
                overflowY: "clip",
              }}
            >
              {arrayCursors(tabGroups).map((tabGroup, index) => {
                const selected = index === tabsData.selectedIndex;
                const maximised = tabs.value.maximised;

                return maximised && !selected ? null : (
                  <Grid
                    key={index}
                    item
                    xs={12 / (maximised ? 1 : tabGroups.value.length)}
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
                      groupsLeft={maximised ? index : undefined}
                      groupsRight={
                        maximised
                          ? tabGroups.value.length - 1 - index
                          : undefined
                      }
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
          <StatusBar showSettings={showSettings} />
        </Stack>
      </PasteImage>
    </Provide>
  );
};
