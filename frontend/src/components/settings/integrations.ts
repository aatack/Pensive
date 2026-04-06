import { usePersistentAtom } from "../../helpers/atoms";
import { useCallback } from "react";
import { useWrite } from "../../context/hooks";
import { addLineNumbers, generateUuid } from "@pensive/common/src";
import { SELECTED_MARKER } from "../../llms";
import { last } from "../../helpers/arrays";
import { exportMarkdown, flatten } from "../../queries/query-manipulation";
import { QueryResult } from "../../queries/queries";

export type Integration = {
  url: string;
  hotkey: string;
};

export const useIntegrations = () => {
  return usePersistentAtom<Integration[]>("pensive-integrations", []);
};

export const useRunIntegration = () => {
  const write = useWrite();

  return useCallback(async (url: string, result: QueryResult) => {
    const content = {
      context: addLineNumbers(
        exportMarkdown(result, 1, 0, SELECTED_MARKER).trim(),
      ),
    };

    const flattened = flatten(result, []);

    const writeReply = (
      lineNumber: number,
      text: string,
      open: boolean | null,
    ) => {
      const childUuid = generateUuid();
      const parentUuid = last(flattened[lineNumber - 1]?.path ?? []);
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

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    const { data } = await response.json();

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
  }, []);
};
