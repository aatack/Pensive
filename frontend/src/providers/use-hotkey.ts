// eslint-disable-next-line import/no-unresolved
import { OptionsOrDependencyArray } from "react-hotkeys-hook/dist/types";
import { useHotkeys } from "react-hotkeys-hook/dist";
import { useProvided } from "./use-provided";

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
  maximiseTabGroup: string;

  selectParent: string;
  selectFollowing: string;
  selectPreceding: string;

  pushFrame: string;
  popFrame: string;
  popFrameIntoTab: string; // Probably going to be removed soon

  addSection: string;
  addOpenEntity: string;
  addFormula: string;
  addEntity: string;
  confirmAddEntity: string;
  cancelAddEntity: string;

  editEntity: string;
  toggleSection: string;
  toggleOpen: string;
  snoozeEntity: string;

  undo: string;
  redo: string;

  collapseEntity: string;
  expandEntity: string;
  pivotEntity: string;

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

export const useHotkey = (
  key: keyof Hotkeys,
  callback: () => void,
  options?: OptionsOrDependencyArray,
) => {
  const hotkey = useProvided("hotkeys").value?.[key];
  useHotkeys(hotkey ?? "", callback, options);
};
