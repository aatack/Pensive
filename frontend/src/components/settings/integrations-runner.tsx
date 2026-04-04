import { useHotkeys } from "react-hotkeys-hook/dist";
import { useIntegrations, useRunIntegration } from "./integrations";
import { ResolvedQuery } from "../pensive";
import { useSetTabRunning } from "../global-status/tab-running";

export const IntegrationsRunner = ({
  resolvedQuery,
  enabled,
  tabUuid,
}: {
  resolvedQuery: ResolvedQuery;
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
          resolvedQuery={resolvedQuery}
          tabUuid={tabUuid}
        />
      ))}
    </>
  );
};

const IntegrationRunner = ({
  hotkey,
  url,
  resolvedQuery,
  tabUuid,
}: {
  hotkey: string;
  url: string;
  resolvedQuery: ResolvedQuery;
  tabUuid: string;
}) => {
  const runIntegration = useRunIntegration();
  const setTabRunning = useSetTabRunning(tabUuid);

  useHotkeys(hotkey, async () => {
    setTabRunning(true);
    await runIntegration(url, resolvedQuery);
    setTabRunning(false);
  });

  return null;
};
