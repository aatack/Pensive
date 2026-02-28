import { ReactNode } from "react";
import { usePersistentAtom } from "../helpers/atoms";
import { Provide } from "./provider";
import { defaultHotkeys } from "../constants";
import { Hotkeys } from "./use-hotkey";

export const ProvideHotkeys = ({ children }: { children: ReactNode }) => {
  const hotkeys = usePersistentAtom<Partial<Hotkeys>>(
    "hotkeys",
    defaultHotkeys,
  );

  return <Provide values={{ hotkeys }}>{children}</Provide>;
};
