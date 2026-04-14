import { Box, Divider, Stack, Typography } from "@mui/material";
import { useEntity, useSwapEntity, useWrite } from "../context/hooks";
import { last } from "../helpers/arrays";
import { Atom } from "../helpers/atoms";
import { Provide } from "../providers/provider";
import { EntityContent } from "./entity/content";
import { Fragment, ReactNode, useEffect, useRef } from "react";
import { useCreateEntityActions } from "./tool/create-entity";
import { useEditEntityActions } from "./tool/edit-entity";
import { useMoveEntityActions } from "./tool/move-entity";
import { useConnectEntityActions } from "./tool/connect-entities";
import { useHotkey } from "../providers/use-hotkey";
import { useNestedQueries, usePivots } from "./tool/pivots";
import { FrameState, TabState, useTabData } from "./tab-hooks";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DoneIcon from "@mui/icons-material/Done";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LockIcon from "@mui/icons-material/Lock";
import { EntityState } from "./entity/entity";
import { EntityPill } from "./entity/entity-pill";
import { font } from "../constants";
import { HoverClickable } from "./common/hover-clickable";
import { useOpenEntityInNewTab } from "./entity/entity-hooks";
import { useToolState } from "./tool/tool";
import { exportMarkdown } from "../queries/helpers";
import { CreateEntity } from "./tool/tool-placeholders";
import { IntegrationsRunner } from "./settings/integrations-runner";
import { FlattenedResult, Query } from "../queries/types";

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
      const markdown = exportMarkdown(tabData.result);
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
  useCollapseActions(tab, selected);

  const entityId = last(tab.value.frame.selection) ?? tab.value.frame.entityId;

  usePivots(entityId, tab, selected);
  useNestedQueries(entityId, tab, selected);

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

  const tool = useToolState();

  return (
    <Provide values={{ tab: { ...tab, selected } }}>
      <IntegrationsRunner
        result={tabData.result}
        enabled={selected}
        tabUuid={tab.value.uuid}
      />

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

        {new Array(...tabData.queriedEntities).map((entityId) => (
          <SubscribeEntity key={entityId} entityId={entityId} />
        ))}

        {tabData.flattenedResult.map((item, index) => (
          <Fragment key={item.path.join("__")}>
            <Entity
              data={item}
              selected={index === tabData.selectedIndex}
              editing={
                tool.value.type === "editEntity" &&
                tool.value.tabUuid === tab.value.uuid &&
                tool.value.path.join(":") === item.path.join(":")
              }
              pivot={item.pivot ?? undefined}
            />

            {tool.value.type === "createEntity" &&
              tool.value.tabUuid === tab.value.uuid &&
              tool.value.path.join(":") === item.path.join(":") && (
                <CreateEntity depth={tool.value.path.length + 1} />
              )}
          </Fragment>
        ))}
      </Box>
    </Provide>
  );
};

const SubscribeEntity = ({ entityId }: { entityId: string }) => {
  useEntity(entityId); // Make sure it's loaded

  return null;
};

const Entity = ({
  data,
  selected,
  editing,
  pivot,
}: {
  data: FlattenedResult;
  selected: boolean;
  editing: boolean;
  pivot?: Query;
}) => {
  const entity = data.entity;

  return (
    <EntityIndent entity={entity} depth={data.path.length}>
      <div style={{ width: "100%" }}>
        <EntityContent
          entityId={data.entityId}
          entity={data.entity}
          collapsed={!data.complete}
          path={data.path}
          selected={selected}
          editing={editing}
          pivot={pivot}
        />
      </div>
    </EntityIndent>
  );
};

export const EntityIndent = ({
  entity,
  depth,
  children,
}: {
  entity: EntityState;
  depth: number;
  children: ReactNode;
}) => {
  return (
    <Stack
      direction="row"
      sx={{ ml: depth * 2, maxWidth: 1, overflowX: "auto" }}
    >
      {entity.redacted ? (
        <LockIcon sx={iconStyle} />
      ) : entity.open === true ? (
        <CheckBoxOutlineBlankIcon sx={iconStyle} />
      ) : entity.open === false ? (
        <DoneIcon sx={iconStyle} />
      ) : entity.section ? null : (
        <KeyboardArrowRightIcon sx={iconStyle} />
      )}

      {children}
    </Stack>
  );
};

const contextEntities = (frame: FrameState | null): string[] =>
  frame == null ? [] : [...contextEntities(frame.context), frame.entityId];

const TabContext = ({ tab }: { tab: TabState }) => {
  const entityIds = contextEntities(tab.frame.context);
  return entityIds.length === 0 ? null : (
    <>
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        sx={{ opacity: 0.6 }}
        alignItems="center"
      >
        {entityIds.map((entityId, index) => (
          <Fragment key={`${index}-${entityId}`}>
            {index !== 0 && (
              <Typography style={{ ...font, fontWeight: 600 }}>
                {"/"}
              </Typography>
            )}
            <TabContextEntity entityId={entityId} />
          </Fragment>
        ))}
      </Stack>
      <Divider sx={{ mb: 1, mt: 0.5 }} />
    </>
  );
};

const TabContextEntity = ({ entityId }: { entityId: string }) => {
  const entity = useEntity(entityId);
  const openEntityInNewTab = useOpenEntityInNewTab();

  return (
    <EntityIndent depth={0} entity={entity}>
      <Stack sx={{ maxWidth: 200 }}>
        <HoverClickable onMiddleClick={() => openEntityInNewTab(entityId)}>
          <Stack sx={{ px: 0.5 }}>
            <EntityPill entity={entity} />
          </Stack>
        </HoverClickable>
      </Stack>
    </EntityIndent>
  );
};

const useCollapseActions = (tab: Atom<TabState>, enabled: boolean) => {
  useHotkey(
    "collapseEntity",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;

      return tab.swap((current) => ({
        ...current,
        collapsed: [
          ...current.collapsed.filter((item) => item !== entityId),
          entityId,
        ],
      }));
    },
    { enabled },
  );
  useHotkey(
    "expandEntity",
    () => {
      const entityId =
        last(tab.value.frame.selection) ?? tab.value.frame.entityId;

      return tab.swap((current) => ({
        ...current,
        collapsed: current.collapsed.filter((item) => item !== entityId),
      }));
    },
    { enabled },
  );
};
