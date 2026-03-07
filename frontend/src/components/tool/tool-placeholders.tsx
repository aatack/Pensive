import { useSwapEntity, useWrite } from "../../context/hooks";
import { last } from "../../helpers/arrays";
import { cursor } from "../../helpers/atoms";
import { TextInput } from "../common/text";
import { generateUuid } from "../../helpers/uuid";
import { useCreateEntityState } from "./create-entity";
import { useEditEntityState } from "./edit-entity";
import { useTabState } from "../tab-hooks";
import { EntityIndent } from "../tab";

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

export const EditEntity = () => {
  const editEntity = useEditEntityState();
  const frame = cursor(useTabState(), "frame");
  const selection = cursor(frame, "selection");
  const swapEntity = useSwapEntity();

  if (editEntity == null) {
    return null;
  }

  const entityId = last(editEntity.value.path) ?? frame.value.entityId;

  const confirm = (text: string) => {
    swapEntity(entityId, () => ({ text }));
    selection.reset(editEntity.value.path);
    editEntity.clear();
  };

  return (
    <TextInput
      confirm={confirm}
      cancel={editEntity.clear}
      initial={editEntity.value.initialValues?.text ?? ""}
    />
  );
};
