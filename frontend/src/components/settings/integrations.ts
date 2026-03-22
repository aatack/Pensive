import { usePersistentAtom } from "../../helpers/atoms";
import { useCallback } from "react";
import { exportResolvedQuery, ResolvedQuery } from "../pensive";
import { useWrite } from "../../context/hooks";
import { addLineNumbers } from "@pensive/common/src";
import { SELECTED_MARKER } from "../../llms";

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
    const content = {
      context: addLineNumbers(
        exportResolvedQuery(query, 1, 0, SELECTED_MARKER).trim(),
      ),
    };

    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
  }, []);
};
