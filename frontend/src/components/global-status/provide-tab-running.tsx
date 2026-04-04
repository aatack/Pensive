import { ReactNode } from "react";
import { useAtom } from "../../helpers/atoms";
import { Provide } from "../../providers/provider";

export const ProvideTabRunning = ({ children }: { children: ReactNode }) => {
  const tabRunning = useAtom<{ [tabUuid: string]: boolean }>({});

  return <Provide values={{ tabRunning }}>{children}</Provide>;
};
