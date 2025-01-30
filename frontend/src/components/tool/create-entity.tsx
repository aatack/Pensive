import { useHotkeys } from "react-hotkeys-hook";
import { useWrite } from "../../context/hooks";
import { last } from "../../helpers/arrays";
import { Atom, cursor } from "../../helpers/atoms";
import { TextInput } from "../common/text";
import { EntityState } from "../entity/entity";
import { EntityIndent } from "../entity/indent";
import { TabState, useTabState } from "../tab";
import { useToolState } from "./tool";

export type CreateEntityState = {
  type: "createEntity";
  tabUuid: string;
  path: string[];
  extraValues?: EntityState;
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

  const startCreating = (extraValues: EntityState) =>
    tool.value.type === "createEntity"
      ? () => null
      : () =>
          tool.reset({
            type: "createEntity",
            tabUuid: tab.uuid,
            path: tab.frame.selection,
            extraValues,
          });

  useHotkeys("enter", startCreating({}), {
    enabled: selected,
    preventDefault: true,
  });
  useHotkeys("/", startCreating({ section: true }), {
    enabled: selected,
    preventDefault: true,
  });
  useHotkeys("shift+slash", startCreating({ open: true }), {
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

  const entityId = last(createEntity.value.path) ?? frame.value.entityId;

  const confirm = (text: string) => {
    const snapshot = write((snapshot) => ({
      [snapshot]: { ...createEntity.value.extraValues, parent: entityId, text },
    }));
    selection.reset([...createEntity.value.path, snapshot]);

    createEntity.clear();
    return snapshot;
  };

  return (
    // Really this should update the tool state on every key press
    <EntityIndent entity={createEntity.value.extraValues ?? {}}>
      <TextInput confirm={confirm} cancel={createEntity.clear} />
    </EntityIndent>
  );
};
