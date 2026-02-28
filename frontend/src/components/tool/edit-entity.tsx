import { useGetEntity } from "../../context/hooks";
import { last } from "../../helpers/arrays";
import { Atom } from "../../helpers/atoms";
import { EntityState } from "../entity/entity";
import { TabState } from "../tab";
import { useToolState } from "./tool";
import { useHotkey } from "../../providers/hotkeys";

export type EditEntityState = {
  type: "editEntity";
  tabUuid: string;
  path: string[];
  initialValues?: EntityState;
};

export const useEditEntityState = () => {
  const tool = useToolState();

  if (tool.value.type === "editEntity") {
    return { ...(tool as Atom<EditEntityState>), clear: tool.clear };
  } else {
    return null;
  }
};

export const useEditEntityActions = (tab: TabState, selected: boolean) => {
  const tool = useToolState();
  const getEntity = useGetEntity();

  const startEditing = () =>
    tool.value.type === "editEntity"
      ? () => null
      : () =>
          getEntity(last(tab.frame.selection) ?? tab.frame.entityId).then(
            (initialValues) =>
              tool.reset({
                type: "editEntity",
                tabUuid: tab.uuid,
                path: tab.frame.selection,
                initialValues,
              }),
          );

  useHotkey("editEntity", startEditing(), {
    enabled: selected,
    preventDefault: true,
  });
};
