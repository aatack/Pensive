import { usePersistentAtom } from "../../helpers/atoms";
import { useCallback } from "react";
import { ResolvedQuery } from "../pensive";
import { useWrite } from "../../context/hooks";

export type Integration = {
  url: string;
  hotkey: string;
};

export const useIntegrations = () => {
  return usePersistentAtom<Integration[]>("pensive-integrations", []);
};

export const useRunIntegration = () => {
  const write = useWrite();

  return useCallback(async (url: string, query: ResolvedQuery) => {
    const content = query;

    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
  }, []);
};
