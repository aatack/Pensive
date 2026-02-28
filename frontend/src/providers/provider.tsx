import { ReactNode, useContext } from "react";
import { Context, PensiveContext } from "./use-provided";

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
