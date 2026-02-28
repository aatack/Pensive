import { ReactNode } from "react";
import { useAtom } from "../../helpers/atoms";
import { Provide } from "../../providers/provider";
import { ToolState } from "./tool";

export const ProvideTool = ({ children }: { children: ReactNode }) => {
  const tool = useAtom<ToolState>({ type: "noTool" });
  return <Provide values={{ tool }}>{children}</Provide>;
};
