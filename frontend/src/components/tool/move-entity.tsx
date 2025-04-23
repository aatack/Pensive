import { useHotkeys } from "react-hotkeys-hook";
import { useWrite } from "../../context/hooks";
import { getFocusedEntityId, TabState } from "../tab";
import { useToolState } from "./tool";

export type MoveEntityState = {
  type: "moveEntity";
  parentUuid: string;
  childUuid: string;
};

export const useMoveEntityActions = (tab: TabState, enabled: boolean) => {
  const tool = useToolState();
  const write = useWrite();

  const initiate = (parentUuid: string, childUuid: string) => {
    if (tool.value.type === "noTool") {
      tool.reset({ type: "moveEntity", parentUuid, childUuid });
    }
  };

  const confirm = (uuid: string) => {
    const value = tool.value;
    if (value.type === "moveEntity") {
      write({
        [value.parentUuid]: { outbound: `-${value.childUuid}` },
        [value.childUuid]: { inbound: [`-${value.parentUuid}`, `+${uuid}`] },
        [uuid]: { outbound: `+${value.childUuid}` },
      });
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
        const path = [tab.frame.entityId, ...tab.frame.selection];
        if (path.length >= 2) {
          initiate(path[path.length - 2]!, path[path.length - 1]!);
        }
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
