import { ReactNode, useEffect } from "react";
import { Metadata, pensiveMetadata } from "../api/endpoints";
import { Atom, useAtom } from "../helpers/atoms";
import { Provide } from "../providers/provider";
import { LinearProgress } from "@mui/material";
import { PensiveState } from "./pensive";

const usePensiveState = (): Atom<PensiveState> => {
  const pensive = useAtom<PensiveState>({
    entities: { default: {}, mapping: {} },
    queries: { default: { status: "waiting", subscribers: 0 }, mapping: {} },
    resources: {
      default: { status: "waiting", subscribers: 0, url: null },
      mapping: {},
    },
    history: { undo: [], redo: [] },
  });

  return pensive;
};

export const ProvidePensive = ({ children }: { children: ReactNode }) => {
  const metadata = useAtom<Metadata | null>(null);
  const pensiveState = usePensiveState();

  useEffect(() => {
    pensiveMetadata().then(metadata.reset);
  }, []);

  return metadata.value == null ? (
    <LinearProgress />
  ) : (
    <Provide values={{ pensive: pensiveState, metadata: metadata.value }}>
      {children}
    </Provide>
  );
};