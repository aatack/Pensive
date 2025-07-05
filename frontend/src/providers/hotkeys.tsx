import { ReactNode } from "react";
import { usePersistentAtom } from "../helpers/atoms";
import { Provide, useProvided } from "./provider";
import { useHotkeys } from "react-hotkeys-hook";
import { OptionsOrDependencyArray } from "react-hotkeys-hook/dist/types";
import { defaultHotkeys } from "../constants";

export type Hotkeys = {
  toggleSections: string;

  search: string;
  cancelSearch: string;
  confirmSearch: string;

  closeTab: string;
  openTab: string;
  selectNextTab: string;
  selectPreviousTab: string;
  selectNextTabGroup: string;
  selectPreviousTabGroup: string;
  incrementTabGroup: string;
  decrementTabGroup: string;

  selectParent: string;
  selectFollowing: string;
  selectPreceding: string;

  pushFrame: string;
  popFrame: string;
  popFrameIntoTab: string; // Probably going to be removed soon

  addSection: string;
  addOpenEntity: string;
  addEntity: string;
  confirmAddEntity: string;
  cancelAddEntity: string;

  editEntity: string;
  toggleSection: string;
  toggleOpen: string;

  collapseEntity: string;
  expandEntity: string;

  debugEntity: string;

  startOutboundConnection: string;
  startInboundConnection: string;
  cancelConnection: string;
  moveConnection: string;
  cancelMoveConnection: string;
  removeConnection: string;

  exportEntity: string;

  redact: string;
  runPrompt: string;
};

export const ProvideHotkeys = ({ children }: { children: ReactNode }) => {
  const hotkeys = usePersistentAtom<Partial<Hotkeys>>(
    "hotkeys",
    defaultHotkeys
  );

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
