import { createContext, ReactNode, useContext } from "react";
import { PensiveState } from "../components/pensive";
import { Atom } from "../helpers/atoms";
import { TabState } from "../components/tab";
import { ToolState } from "../components/tool/tool";
import { TabsState } from "../components/tabs";
import { Metadata } from "../api/endpoints";

export type PensiveContext = Partial<{
  pensive: Atom<PensiveState>;
  metadata: Metadata;
  tabs: Atom<TabsState>;
  tab: Atom<TabState> & { selected: boolean };
  tool: Atom<ToolState>;
}>;

const Context = createContext<PensiveContext>({});

export const Provide = ({
  values,
  children,
}: {
  values: { [K in keyof PensiveContext]: PensiveContext[K] };
  children: ReactNode;
}) => {
  const currentValues = useContext(Context) ?? {};

  return (
    <Context.Provider value={{ ...currentValues, ...values }}>
      {children}
    </Context.Provider>
  );
};

export const useProvided = <K extends keyof PensiveContext>(
  key: K
): Exclude<PensiveContext[K], undefined> => {
  const value = useContext(Context)[key];

  if (value === undefined) {
    throw new Error(`No value provided for key ${key}`);
  } else {
    return value as Exclude<PensiveContext[K], undefined>;
  }
};
