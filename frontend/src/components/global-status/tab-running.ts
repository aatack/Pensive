import { useProvided } from "../../providers/use-provided";

export const useTabRunning = (tabUuid: string): boolean => {
  return Boolean(useProvided("tabRunning").value[tabUuid]);
};

export const useSetTabRunning = (tabUuid: string) => {
  const tabRunning = useProvided("tabRunning");
  return (running: boolean) =>
    tabRunning.swap((current) => ({ ...current, [tabUuid]: running }));
};
