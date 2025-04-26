import { useWrite } from "../../context/hooks";

export type ConnectEntities = {
  type: "connectEntities";
  kind: "create" | "remove";

  sourceUuid: string;
  destinationUuid: string;
};

export const useConnectEntities = () => {
  const write = useWrite();

  return ({ kind, sourceUuid, destinationUuid }: ConnectEntities) =>
    write({
      [sourceUuid]: {
        outbound:
          kind === "create" ? `+${destinationUuid}` : `-${destinationUuid}`,
      },
      [destinationUuid]: {
        inbound: kind === "create" ? `+${sourceUuid}` : `-${sourceUuid}`,
      },
    });
};
