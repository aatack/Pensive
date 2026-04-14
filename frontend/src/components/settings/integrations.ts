import { usePersistentAtom } from "../../helpers/atoms";
import { useCallback } from "react";
import { useWrite } from "../../context/hooks";
import { generateUuid } from "@pensive/common/src";
import { last } from "../../helpers/arrays";
import { exportMarkdown } from "../../queries/query-manipulation";
import { QueryResult } from "../../queries/queries";
import { flatten, Result } from "../../queries/combined-query";

export type Integration = {
  url: string;
  hotkey: string;
};

export const useIntegrations = () => {
  return usePersistentAtom<Integration[]>("pensive-integrations", []);
};

export const useRunIntegration = () => {
  const write = useWrite();

  return useCallback(async (url: string, result: Result) => {
    const content = {
      context: exportMarkdown(result, { lineNumbers: true, selectedPath: [] }),
    };

    const flattened = flatten(result, []);

    const writeReply = (
      lineNumber: number,
      text: string,
      open: boolean | null,
    ) => {
      const childUuid = generateUuid();
      const parentUuid = flattened[lineNumber - 1]?.entityId;
      if (parentUuid == null) {
        return;
      }

      write({
        [childUuid]: {
          inbound: `+${parentUuid}`,
          text,
          open,
          ai: true,
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
