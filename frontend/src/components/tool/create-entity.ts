import { Atom } from "../../helpers/atoms";
import { useHotkey } from "../../providers/use-hotkey";
import { EntityState } from "../entity/entity";
import { TabState } from "../tab-hooks";
import { useToolState } from "./tool";

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
  useHotkey("addFormula", startCreating({ type: "formula" }), {
    enabled: selected,
    preventDefault: true,
  });
};
