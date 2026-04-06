import { PensiveState } from "../components/pensive";
import { Atom } from "../helpers/atoms";
import { ToolState } from "../components/tool/tool";
import { Metadata } from "../api/endpoints";
import { TabState } from "../components/tab-hooks";
import { TabsState } from "../components/tabs-hooks";
import { Hotkeys } from "./use-hotkey";
import { createContext, useContext } from "react";

export const Context = createContext<PensiveContext>({});

export type PensiveContext = Partial<{
  pensive: Atom<PensiveState>;
  metadata: Metadata;
  tabs: Atom<TabsState>;
  tab: Atom<TabState> & { selected: boolean };
  tool: Atom<ToolState>;
  hotkeys: Atom<Partial<Hotkeys>>;
  tabRunning: Atom<{ [tabId: string]: boolean }>;
}>;

export const useProvided = <K extends keyof PensiveContext>(
  key: K,
): Exclude<PensiveContext[K], undefined> => {
  const value = useContext(Context)[key];

  if (value === undefined) {
    throw new Error(`No value provided for key ${key}`);
  } else {
    return value as Exclude<PensiveContext[K], undefined>;
  }
};
