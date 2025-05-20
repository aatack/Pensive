import { ReactNode } from "react";
import { useAtom } from "../helpers/atoms";
import { Provide, useProvided } from "./provider";
import { useHotkeys } from "react-hotkeys-hook";
import { OptionsOrDependencyArray } from "react-hotkeys-hook/dist/types";

export type Hotkeys = {
  toggleSections: string;
  
  search: string
  cancelSearch: string
  confirmSearch: string

  closeTab: string
  openTab: string
  selectNextTab: string
  selectPreviousTab: string
  selectNextTabGroup: string
  selectPreviousTabGroup: string
  incrementTabGroup: string
  decrementTabGroup: string

  popFrameIntoTab: string // Probably going to be removed soon

  selectParent: string
  selectFollowing: string
  selectPreceding: string

  removeConnection: string

  pushFrame: string
  popFrame: string

  addSection: string
  addOpenEntity: string
  addEntity: string
  confirmAddEntity: string
  cancelAddEntity: string

  editEntity: string
  toggleSection: string
  toggleOpen: string

  collapseEntity: string
  expandEntity: string

  debugEntity: string

  startOutboundConnection: string
  startInboundConnection: string
  cancelConnection: string
  moveConnection: string
  cancelMoveConnection: string

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
