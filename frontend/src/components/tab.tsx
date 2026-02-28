import { Box, Divider } from "@mui/material";
import { useEntity, useSwapEntity, useWrite } from "../context/hooks";
import { last } from "../helpers/arrays";
import { Atom, cursor } from "../helpers/atoms";
import { Provide } from "../providers/provider";
import { EntityIndent } from "./entity/indent";
import { EntityContent } from "./entity/content";
import { useEffect, useRef } from "react";
import { exportResolvedQuery } from "./pensive";
import { useCreateEntityActions } from "./tool/create-entity";
import { useEditEntityActions } from "./tool/edit-entity";
import { useMoveEntityActions } from "./tool/move-entity";
import { useConnectEntityActions } from "./tool/connect-entities";
import { useHotkey } from "../providers/use-hotkey";
import { useRunPrompt } from "../llms";
import { usePivots } from "./tool/pivots";
import { FrameState, TabState, useTabData } from "./tab-hooks";
import { Entity } from "./entity/render-entity";
import { FlattenedResolvedQuery } from "../queries/queries";

const useTabActions = (tab: Atom<TabState>, selected: boolean) => {
  const tabData = useTabData(tab);

  const swapEntity = useSwapEntity();
  const write = useWrite();

  useHotkey("selectParent", tabData.selectParent, { enabled: selected });
  useHotkey("selectFollowing", tabData.selectFollowing, { enabled: selected });
  useHotkey("selectPreceding", tabData.selectPreceding, { enabled: selected });

  // useHotkey(
  //   "exportEntity",
  //   () => {
  //     const markdown = exportResolvedQuery(tabData.resolvedQuery).trim();
  //     navigator.clipboard.writeText(markdown);
  //   },
  //   { enabled: selected },
  // );

  // const runPrompt = useRunPrompt();
  // useHotkey(
  //   "runPrompt",
  //   () => runPrompt(tabData.resolvedQuery, cursor(tab, "frame")),
  //   { enabled: selected, keyup: true },
  // );

  useHotkey(
    "removeConnection",
    () => {
      const path = [tab.value.frame.entityId, ...tab.value.frame.selection];
      const parentUuid = path[path.length - 2];
      const childUuid = path[path.length - 1];
      if (parentUuid != null && childUuid != null) {
        tabData.selectPreceding();
        write({
          [parentUuid]: { outbound: `-${childUuid}` },
          [childUuid]: { inbound: `-${parentUuid}` },
        });
      }
    },
    { enabled: selected },
  );

  useHotkey("pushFrame", tabData.pushFrame, { enabled: selected });
  useHotkey("popFrame", tabData.popFrame, { enabled: selected });

  useCreateEntityActions(tab.value, selected);
  useEditEntityActions(tab.value, selected);
  useMoveEntityActions(tab.value, selected);
  useConnectEntityActions(tab.value, selected);
  useCollapsedExpandedActions(tab, selected);

  const entityId = last(tab.value.frame.selection) ?? tab.value.frame.entityId;

  usePivots(entityId, tab, selected);

  useHotkey(
    "toggleSection",
    () =>
      swapEntity(entityId, (current) => ({
        section: current.section ? null : true,
      })),
    { enabled: selected, preventDefault: true },
  );
  useHotkey(
    "toggleOpen",
    () =>
      swapEntity(entityId, (current) => ({
        open: current.open == null ? true : current.open ? false : null,
      })),
    { enabled: selected, preventDefault: true },
  );
  useHotkey(
    "snoozeEntity",
    () =>
      swapEntity(entityId, (current) => {
        const now = new Date();
        const timestamp =
          current.snoozed == null || new Date(current.snoozed) < now
            ? now
            : new Date(current.snoozed);
        return {
          // Advance the snooze date by a day
          snoozed: new Date(timestamp.getTime() + 86400 * 1000).toISOString(),
        };
      }),
    { enabled: selected, preventDefault: true },
  );
  useHotkey(
    "redact",
    () =>
      swapEntity(entityId, (current) => ({
        redacted: current.redacted ? null : true,
      })),
    { enabled: selected, preventDefault: true },
  );

  return tabData;
};

export const Tab = ({
  tab,
  selected,
}: {
  tab: Atom<TabState>;
  selected: boolean;
}) => {
  const ref = useRef<HTMLDivElement>();

  const tabData = useTabActions(tab, selected);

  useEffect(() => {
    // Restore the scroll position when the tab is brought back into view
    if (ref.current && tab.value.scrollPosition !== undefined) {
      ref.current.scrollTop = tab.value.scrollPosition;
    }
  }, [ref]);

  return (
    <Provide values={{ tab: { ...tab, selected } }}>
      <Box
        ref={ref}
        sx={{ p: "4px", overflowY: "auto" }}
        onScroll={() => {
          const box = ref.current;
          if (box) {
            tab.swap((current) => ({
              ...current,
              scrollPosition: box.scrollTop,
            }));
          }
        }}
      >
        <TabContext tab={tab.value} />

        {/* <Entity resolvedQuery={tabData.resolvedQuery} /> */}

        {tabData.flattenedQuery.length}

        {tabData.flattenedQuery.map((item) => (
          <Placeholder key={item.path.join("__")} data={item} />
        ))}
      </Box>
    </Provide>
  );
};

const Placeholder = ({ data }: { data: FlattenedResolvedQuery }) => {
  useEntity(data.entityId); // Make sure it's loaded
  return (
    <p style={{ marginLeft: data.path.length * 24 }}>{data.entity.text}</p>
  );
};

const contextEntities = (frame: FrameState | null): string[] =>
  frame == null ? [] : [...contextEntities(frame.context), frame.entityId];

const TabContext = ({ tab }: { tab: TabState }) => {
  const entityIds = contextEntities(tab.frame.context);
  return entityIds.length === 0 ? null : (
    <>
      {entityIds.map((entityId) => (
        <TabContextEntity key={entityId} entityId={entityId} />
      ))}

      <Divider sx={{ m: 1 }} />
    </>
  );
};

const TabContextEntity = ({ entityId }: { entityId: string }) => {
  const entity = useEntity(entityId);
  return (
    <EntityIndent entity={entity}>
      <EntityContent
        resolvedQuery={{
          entity,
          entityId,
          path: [],
          children: [],
          highlight: true,
          collapsed: false,
          hasHiddenChildren: false,
          selected: false,
          createEntity: false,
          editEntity: false,
        }}
      />
    </EntityIndent>
  );
};

const useCollapsedExpandedActions = (tab: Atom<TabState>, enabled: boolean) => {
  useHotkey(
    "collapseEntity",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;
      const expanded = tab.value.expanded.includes(entityId);

      return tab.swap((current) => ({
        ...current,
        collapsed: expanded
          ? current.collapsed
          : [
              ...current.collapsed.filter((item) => item !== entityId),
              entityId,
            ],
        expanded: expanded
          ? current.expanded.filter((item) => item !== entityId)
          : current.expanded,
      }));
    },
    { enabled },
  );
  useHotkey(
    "expandEntity",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;

      const collapsed = tab.value.collapsed.includes(entityId);
      return tab.swap((current) => ({
        ...current,
        collapsed: collapsed
          ? current.collapsed.filter((item) => item !== entityId)
          : current.collapsed,
        expanded: collapsed
          ? current.expanded
          : [...current.expanded.filter((item) => item !== entityId), entityId],
      }));
    },
    { enabled },
  );
};
