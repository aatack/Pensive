import equal from "fast-deep-equal";
import { useMemo, useRef } from "react";

export const useDeepMemo = <T, K extends object>(
  factory: () => T,
  dependencies: K
) => {
  const previousDependencies = useRef<K | null>(null);

  const shouldUpdate = !equal(previousDependencies.current, dependencies);

  const memoisedValue = useMemo(() => {
    if (shouldUpdate) {
      previousDependencies.current = dependencies;
    }
    return factory();
  }, [shouldUpdate, factory]);

  return memoisedValue;
};
