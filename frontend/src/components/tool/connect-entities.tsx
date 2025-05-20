import { useHotkeys } from "react-hotkeys-hook/dist";
import { useWrite } from "../../context/hooks";
import { getFocusedEntityId, TabState } from "../tab";
import { useToolState } from "./tool";
import { useHotkey } from "../../providers/hotkeys";

export type ConnectEntities = {
  kind: "create" | "remove";

  sourceUuid: string;
  destinationUuid: string;
};

export type ConnectEntitiesState = {
  type: "connectEntities";
  sourceUuid: string | null;
  destinationUuid: string | null;
};

export const useConnectEntities = () => {
  const write = useWrite();

  return ({ kind, sourceUuid, destinationUuid }: ConnectEntities) => {
    if (sourceUuid !== destinationUuid) {
      return write({
        [sourceUuid]: {
          outbound:
            kind === "create" ? `+${destinationUuid}` : `-${destinationUuid}`,
        },
        [destinationUuid]: {
          inbound: kind === "create" ? `+${sourceUuid}` : `-${sourceUuid}`,
        },
      });
    }
  };
};

export const useConnectEntityActions = (tab: TabState, enabled: boolean) => {
  const tool = useToolState();
  const connect = useConnectEntities();

  const initiate = (
    sourceUuid: string | null,
    destinationUuid: string | null
  ) => {
    if (tool.value.type === "noTool") {
      tool.reset({ type: "connectEntities", sourceUuid, destinationUuid });
    }
  };

  const confirm = (uuid: string) => {
    const value = tool.value;
    if (value.type === "connectEntities") {
      connect({
        kind: "create",
        sourceUuid: value.sourceUuid ?? uuid,
        destinationUuid: value.destinationUuid ?? uuid,
      });
      tool.clear();
    }
  };

  const cancel = () => {
    if (tool.value.type === "connectEntities") {
      tool.clear();
    }
  };

  // Initiate connection with the current entity as the source
  useHotkey(
    "startOutboundConnection",
    () => {
      const uuid = getFocusedEntityId(tab);
      if (tool.value.type === "connectEntities") {
        confirm(uuid);
      } else {
        initiate(uuid, null);
      }
    },
    { enabled }
  );

  // Initiate connection with the current entity as the destination
  useHotkey(
    "startInboundConnection",
    () => {
      const uuid = getFocusedEntityId(tab);
      if (tool.value.type === "connectEntities") {
        confirm(uuid);
      } else {
        initiate(null, uuid);
      }
    },
    { enabled }
  );

  // Cancel the current connection
  useHotkey(
    "cancelConnection",
    () => {
      if (tool.value.type === "connectEntities") {
        cancel();
      }
    },
    { enabled }
  );
};
