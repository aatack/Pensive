import { Hotkeys } from "./providers/hotkeys";

export const server = "http://localhost:2998";

const DARK_MODE = false;

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export const invertColour = (colour: string): string => {
  if (!DARK_MODE) {
    return colour;
  }

  if (colour === "lightblue") {
    return "darkblue";
  }

  const [r, g, b] = colour
    .replace("rgb(", "")
    .replace(")", "")
    .split(", ")
    .map((brightness) => parseInt(brightness))
    .map((brightness) => 255 - brightness);
  return `rgb(${r}, ${g}, ${b})`;
};

export const colours = {
  bg: invertColour("rgb(255, 252, 240)"),
  bg2: invertColour("rgb(242, 240, 229)"),
  ui: invertColour("rgb(230, 228, 217)"),
  ui2: invertColour("rgb(218, 216, 206)"),
  ui3: invertColour("rgb(206, 205, 195)"),
  tx3: invertColour("rgb(183, 181, 172)"),
  tx2: invertColour("rgb(111, 110, 105)"),
  tx: invertColour("rgb(16, 15, 15)"),
  re: invertColour("rgb(175, 48, 41)"),
  or: invertColour("rgb(188, 82, 21)"),
  ye: invertColour("rgb(173, 131, 1)"),
  gr: invertColour("rgb(102, 128, 11)"),
  cy: invertColour("rgb(36, 131, 123)"),
  bl: invertColour("rgb(32, 94, 166)"),
  pu: invertColour("rgb(94, 64, 157)"),
  ma: invertColour("rgb(160, 47, 111)"),
  liRe: invertColour("rgb(209, 77, 65)"),
  liOr: invertColour("rgb(218, 112, 44)"),
  liYe: invertColour("rgb(208, 162, 21)"),
  liGr: invertColour("rgb(135, 154, 57)"),
  liCy: invertColour("rgb(58, 169, 159)"),
  liBl: invertColour("rgb(67, 133, 190)"),
  liPu: invertColour("rgb(139, 126, 200)"),
  liMa: invertColour("rgb(206, 93, 151)"),
};

export const font = {
  fontWeight: 400,
  fontFamily: "SourceSans3",
  fontSize: 14.5,
};
export const fontMonospace = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1.6,
  fontFamily: "Fira Code, monospace",
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
  maximiseTabGroup: "m",

  selectParent: "a",
  selectFollowing: "s",
  selectPreceding: "w",

  pushFrame: "d",
  popFrame: "shift+a",
  popFrameIntoTab: "ctrl+d",

  addSection: "/",
  addOpenEntity: "shift+slash",
  addFormula: "shift+enter",
  addEntity: "enter",
  confirmAddEntity: "enter",
  cancelAddEntity: "escape",

  editEntity: "e",
  toggleSection: "ctrl+/",
  toggleOpen: "shift+.",
  snoozeEntity: "t",

  undo: "ctrl+z",
  redo: "ctrl+y",

  collapseEntity: "left",
  expandEntity: "right",
  pivotEntity: "f",

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
