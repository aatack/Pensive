import { ReactNode } from "react";
import { useAtom } from "../../helpers/atoms";
import { Provide, useProvided } from "../../providers/provider";
import { CreateEntityState } from "./create-entity";
import { EditEntityState } from "./edit-entity";
import { MoveEntityState } from "./move-entity";
import { ConnectEntitiesState } from "./connect-entities";

export type ToolState =
  | NoToolState
  | CreateEntityState
  | EditEntityState
  | MoveEntityState
  | ConnectEntitiesState;

export type NoToolState = { type: "noTool" };

export const useToolState = () => {
  const tool = useProvided("tool");
  return { ...tool, clear: () => tool.reset({ type: "noTool" }) };
};

export const ProvideTool = ({ children }: { children: ReactNode }) => {
  const tool = useAtom<ToolState>({ type: "noTool" });
  return <Provide values={{ tool }}>{children}</Provide>;
};
