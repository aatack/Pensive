import { usePersistentAtom } from "../../helpers/atoms";
import { useCallback } from "react";
import {
  exportResolvedQuery,
  flattenResolvedQuery,
  ResolvedQuery,
} from "../pensive";
import { useWrite } from "../../context/hooks";
import { addLineNumbers, generateUuid } from "@pensive/common/src";
import { SELECTED_MARKER } from "../../llms";
import { last } from "../../helpers/arrays";

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

    const flattened = flattenResolvedQuery(query);

    const writeReply = (
      lineNumber: number,
      text: string,
      open: boolean | null,
    ) => {
      const childUuid = generateUuid();
      const parentUuid = last(flattened[lineNumber - 1]?.split("__") ?? []);
      if (parentUuid == null) {
        return;
      }

      write({
        [childUuid]: {
          inbound: `+${parentUuid}`,
          text,
          open,
        },
        [parentUuid]: { outbound: `+${childUuid}` },
      });
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    })
      .then((response) => response.json())
      .then(({ data }) => {
        if (Array.isArray(data)) {
          for (const item of data) {
            const lineNumber = item.lineNumber;
            const text = item.text;
            const open = item.open;

            if (
              typeof lineNumber === "number" &&
              typeof text === "string" &&
              (open == null || typeof open === "boolean")
            ) {
              writeReply(lineNumber, text, open);
            }
          }
        }
      });
  }, []);
};
