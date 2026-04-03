import { useHotkeys } from "react-hotkeys-hook/dist";
import { useIntegrations, useRunIntegration } from "./integrations";
import { ResolvedQuery } from "../pensive";

export const IntegrationsRunner = ({
  resolvedQuery,
  enabled,
}: {
  resolvedQuery: ResolvedQuery;
  enabled: boolean;
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
        />
      ))}
    </>
  );
};

const IntegrationRunner = ({
  hotkey,
  url,
  resolvedQuery,
}: {
  hotkey: string;
  url: string;
  resolvedQuery: ResolvedQuery;
}) => {
  const runIntegration = useRunIntegration();

  useHotkeys(hotkey, () => {
    runIntegration(url, resolvedQuery);
  });

  return null;
};
