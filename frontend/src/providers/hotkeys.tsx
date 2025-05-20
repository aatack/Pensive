import { ReactNode } from "react";
import { useAtom } from "../helpers/atoms";
import { Provide, useProvided } from "./provider";
import { useHotkeys } from "react-hotkeys-hook";
import { OptionsOrDependencyArray } from "react-hotkeys-hook/dist/types";

export type Hotkeys = {
  navigateUp: string;
};

export const ProvideHotkeys = ({ children }: { children: ReactNode }) => {
  // Should later be switched to a persisted atom
  const hotkeys = useAtom<Partial<Hotkeys>>({});

  return <Provide values={{ hotkeys }}>{children}</Provide>;
};

export const useHotkey = (
  key: keyof Hotkeys,
  callback: () => void,
  options?: OptionsOrDependencyArray
) => {
  const hotkey = useProvided("hotkeys").value?.[key];
  useHotkeys(hotkey ?? "", callback, options);
};
