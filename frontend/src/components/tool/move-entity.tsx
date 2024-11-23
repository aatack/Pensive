import { useHotkeys } from "react-hotkeys-hook";
import { useWrite } from "../../context/hooks";
import { getFocusedEntityId, TabState } from "../tab";
import { useToolState } from "./tool";

export type MoveEntityState = {
  type: "moveEntity";
  entityId: string;
};

export const useMoveEntityActions = (tab: TabState, enabled: boolean) => {
  const tool = useToolState();
  const write = useWrite();

  const initiate = (entityId: string) => {
    if (tool.value.type === "noTool") {
      tool.reset({ type: "moveEntity", entityId });
    }
  };

  const confirm = (entityId: string) => {
    const value = tool.value;
    if (value.type === "moveEntity") {
      write(() => ({ [value.entityId]: { parent: entityId } }));
      tool.clear();
    }
  };

  const cancel = () => {
    if (tool.value.type === "moveEntity") {
      tool.clear();
    }
  };

  useHotkeys(
    "x",
    () => {
      if (tool.value.type === "moveEntity") {
        confirm(getFocusedEntityId(tab));
      } else {
        initiate(getFocusedEntityId(tab));
      }
    },
    { enabled }
  );
  useHotkeys(
    "escape",
    () => {
      if (tool.value.type === "moveEntity") {
        cancel();
      }
    },
    { enabled }
  );
};
