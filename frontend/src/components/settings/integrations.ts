import { useHotkeys } from "react-hotkeys-hook/dist";
import { usePersistentAtom } from "../../helpers/atoms";

export type Integration = {
  url: string;
  hotkey: string;
};

export const useIntegrations = () => {
  return usePersistentAtom<Integration[]>("pensive-integrations", []);
};

export const useIntegration = (integration: Integration) => {
  const content = {};

  useHotkeys(integration.hotkey, () => {
    fetch(integration.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
  });
};
