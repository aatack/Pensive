import { useHotkeys } from "react-hotkeys-hook/dist";
import { useIntegrations, useRunIntegration } from "./integrations";
import { useSetTabRunning } from "../global-status/tab-running";
import { QueryResult } from "../../queries/types";

export const IntegrationsRunner = ({
  result,
  enabled,
  tabUuid,
}: {
  result: QueryResult;
  enabled: boolean;
  tabUuid: string;
}) => {
  const integrations = useIntegrations();

  if (!enabled) {
    return;
  }

  return (
    <>
      {integrations.value.map((integration) => (
        <IntegrationRunner
          key={integration.url}
          url={integration.url}
          hotkey={integration.hotkey}
          result={result}
          tabUuid={tabUuid}
        />
      ))}
    </>
  );
};

const IntegrationRunner = ({
  hotkey,
  url,
  result,
  tabUuid,
}: {
  hotkey: string;
  url: string;
  result: QueryResult;
  tabUuid: string;
}) => {
  const runIntegration = useRunIntegration();
  const setTabRunning = useSetTabRunning(tabUuid);

  useHotkeys(hotkey, async () => {
    setTabRunning(true);
    await runIntegration(url, result);
    setTabRunning(false);
  });

  return null;
};
