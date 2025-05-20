import { useHotkeys } from "react-hotkeys-hook";
import { useWrite } from "../../context/hooks";
import { getFocusedEntityId, TabState } from "../tab";
import { useToolState } from "./tool";
import { useHotkey } from "../../providers/hotkeys";

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
      // Cancel the operation if it would be a degenerate move - ie. if any of
      // the arguments are the same as each other
      if (new Set([value.parentUuid, value.childUuid, uuid]).size === 3) {
        write({
          [value.parentUuid]: { outbound: `-${value.childUuid}` },
          [value.childUuid]: { inbound: [`-${value.parentUuid}`, `+${uuid}`] },
          [uuid]: { outbound: `+${value.childUuid}` },
        });
      }
      tool.clear();
    }
  };

  const cancel = () => {
    if (tool.value.type === "moveEntity") {
      tool.clear();
    }
  };

  useHotkey(
    "moveConnection",
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
  useHotkey(
    "cancelMoveConnection",
    () => {
      if (tool.value.type === "moveEntity") {
        cancel();
      }
    },
    { enabled }
  );
};
