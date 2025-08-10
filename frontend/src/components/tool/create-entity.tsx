import { useWrite } from "../../context/hooks";
import { last } from "../../helpers/arrays";
import { Atom, cursor } from "../../helpers/atoms";
import { TextInput } from "../common/text";
import { EntityState } from "../entity/entity";
import { EntityIndent } from "../entity/indent";
import { TabState, useTabState } from "../tab";
import { useToolState } from "./tool";
import { generateUuid } from "../../helpers/uuid";
import { useHotkey } from "../../providers/hotkeys";

export type CreateEntityState = {
  type: "createEntity";
  tabUuid: string;
  path: string[];
  extraUpdates?: EntityState;
};

export const useCreateEntityState = () => {
  const tool = useToolState();

  if (tool.value.type === "createEntity") {
    return { ...(tool as Atom<CreateEntityState>), clear: tool.clear };
  } else {
    return null;
  }
};

export const useCreateEntityActions = (tab: TabState, selected: boolean) => {
  const tool = useToolState();

  const startCreating = (extraUpdates: EntityState) =>
    tool.value.type === "createEntity"
      ? () => null
      : () =>
          tool.reset({
            type: "createEntity",
            tabUuid: tab.uuid,
            path: tab.frame.selection,
            extraUpdates,
          });

  useHotkey("addEntity", startCreating({}), {
    enabled: selected,
    preventDefault: true,
  });
  useHotkey("addSection", startCreating({ section: true }), {
    enabled: selected,
    preventDefault: true,
  });
  useHotkey("addOpenEntity", startCreating({ open: true }), {
    enabled: selected,
    preventDefault: true,
  });
  useHotkey("addFormula", startCreating({ formula: true }), {
    enabled: selected,
    preventDefault: true,
  });
};

export const CreateEntity = () => {
  const createEntity = useCreateEntityState();
  const frame = cursor(useTabState(), "frame");
  const selection = cursor(frame, "selection");
  const write = useWrite();

  if (createEntity == null) {
    return null;
  }

  const parentUuid = last(createEntity.value.path) ?? frame.value.entityId;

  const confirm = (text: string) => {
    const childUuid = generateUuid();
    write({
      [childUuid]: {
        inbound: `+${parentUuid}`,
        text,
        ...createEntity.value.extraUpdates,
      },
      [parentUuid]: { outbound: `+${childUuid}` },
    });
    selection.reset([...createEntity.value.path, childUuid]);

    createEntity.clear();
  };

  return (
    // Really this should update the tool state on every key press
    <EntityIndent entity={createEntity.value.extraUpdates ?? {}}>
      <TextInput confirm={confirm} cancel={createEntity.clear} />
    </EntityIndent>
  );
};
