import { Box, Divider, Stack } from "@mui/material";
import { useEntity, useSwapEntity, useWrite } from "../context/hooks";
import { last } from "../helpers/arrays";
import { Atom } from "../helpers/atoms";
import { Provide } from "../providers/provider";
import { EntityIndent } from "./entity/indent";
import { EntityContent } from "./entity/content";
import { memo, useEffect, useRef } from "react";
import { useCreateEntityActions } from "./tool/create-entity";
import { useEditEntityActions } from "./tool/edit-entity";
import { useMoveEntityActions } from "./tool/move-entity";
import { useConnectEntityActions } from "./tool/connect-entities";
import { useHotkey } from "../providers/use-hotkey";
import { usePivots } from "./tool/pivots";
import { FrameState, TabState, useTabData } from "./tab-hooks";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DoneIcon from "@mui/icons-material/Done";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LockIcon from "@mui/icons-material/Lock";
import {
  exportResolvedQuery,
  FlattenedResolvedQuery,
} from "../queries/queries";
import equal from "fast-deep-equal";

const iconStyle = { fontSize: 14, opacity: 0.5, margin: 0.5 };

const useTabActions = (tab: Atom<TabState>, selected: boolean) => {
  const tabData = useTabData(tab);

  const swapEntity = useSwapEntity();
  const write = useWrite();

  useHotkey("selectParent", tabData.selectParent, { enabled: selected });
  useHotkey("selectFollowing", tabData.selectFollowing, { enabled: selected });
  useHotkey("selectPreceding", tabData.selectPreceding, { enabled: selected });

  useHotkey(
    "exportEntity",
    () => {
      const markdown = exportResolvedQuery(tabData.resolvedQuery).trim();
      navigator.clipboard.writeText(markdown);
    },
    { enabled: selected },
  );

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
        {/* <TabContext tab={tab.value} /> */}

        {/* <Entity resolvedQuery={tabData.resolvedQuery} /> */}

        {tabData.flattenedQuery.length}

        {tabData.flattenedQuery.map((item, index) => (
          <Placeholder
            key={item.path.join("__")}
            data={item}
            selected={index === tabData.selectedIndex}
          />
        ))}
      </Box>
    </Provide>
  );
};

const Placeholder = ({
  data,
  selected,
}: {
  data: FlattenedResolvedQuery;
  selected: boolean;
}) => {
  useEntity(data.entityId); // Make sure it's loaded
  const entity = data.entity;

  return (
    <Stack direction="row" sx={{ ml: data.path.length * 2 }}>
      {/* Start here */}
      {entity.redacted ? (
        <LockIcon sx={iconStyle} />
      ) : entity.open === true ? (
        <CheckBoxOutlineBlankIcon sx={iconStyle} />
      ) : entity.open === false ? (
        <DoneIcon sx={iconStyle} />
      ) : entity.section ? null : (
        <KeyboardArrowRightIcon sx={iconStyle} />
      )}
      <EntityContent
        entityId={data.entityId}
        entity={data.entity}
        collapsed={data.collapsed}
        path={data.path}
        selected={selected}
        editing={false}
      />
    </Stack>
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
