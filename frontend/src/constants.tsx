import { Hotkeys } from "./providers/hotkeys";

export const server = "http://localhost:2998";

export const colours = {
  bg: "rgb(255, 252, 240)",
  bg2: "rgb(242, 240, 229)",
  ui: "rgb(230, 228, 217)",
  ui2: "rgb(218, 216, 206)",
  ui3: "rgb(206, 205, 195)",
  tx3: "rgb(183, 181, 172)",
  tx2: "rgb(111, 110, 105)",
  tx: "rgb(16, 15, 15)",
  re: "rgb(175, 48, 41)",
  or: "rgb(188, 82, 21)",
  ye: "rgb(173, 131, 1)",
  gr: "rgb(102, 128, 11)",
  cy: "rgb(36, 131, 123)",
  bl: "rgb(32, 94, 166)",
  pu: "rgb(94, 64, 157)",
  ma: "rgb(160, 47, 111)",
  liRe: "rgb(209, 77, 65)",
  liOr: "rgb(218, 112, 44)",
  liYe: "rgb(208, 162, 21)",
  liGr: "rgb(135, 154, 57)",
  liCy: "rgb(58, 169, 159)",
  liBl: "rgb(67, 133, 190)",
  liPu: "rgb(139, 126, 200)",
  liMa: "rgb(206, 93, 151)",
};

export const font = {
  fontWeight: 400,
  fontFamily: "SourceSans3",
  fontSize: 14.5,
};

// Set to `""` for no default
export const defaultHotkeys: Hotkeys = {
  toggleSections: "q",

  search: "ctrl+f",
  cancelSearch: "escape",
  confirmSearch: "enter",

  closeTab: "ctrl+w",
  openTab: "ctrl+t",
  selectNextTab: "ctrl+tab",
  selectPreviousTab: "ctrl+shift+tab",
  selectNextTabGroup: "alt+right",
  selectPreviousTabGroup: "alt+left",
  incrementTabGroup: "ctrl+alt+right",
  decrementTabGroup: "ctrl+alt+left",

  selectParent: "a",
  selectFollowing: "s",
  selectPreceding: "w",

  pushFrame: "d",
  popFrame: "shift+a",
  popFrameIntoTab: "ctrl+d",

  addSection: "/",
  addOpenEntity: "shift+slash",
  addEntity: "enter",
  confirmAddEntity: "enter",
  cancelAddEntity: "escape",

  editEntity: "e",
  toggleSection: "ctrl+/",
  toggleOpen: "shift+.",

  collapseEntity: "left",
  expandEntity: "right",

  debugEntity: "3",

  startOutboundConnection: "r",
  startInboundConnection: "shift+r",
  cancelConnection: "escape",
  moveConnection: "x",
  cancelMoveConnection: "escape",
  removeConnection: "delete,backspace",

  exportEntity: "ctrl+e",

  redact: "shift+1",
  runPrompt: "#",
};
