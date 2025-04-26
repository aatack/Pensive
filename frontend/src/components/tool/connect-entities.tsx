export type ConnectEntities = {
  type: "connectEntities";
  kind: "create" | "remove";

  sourceUuid: string;
  destinationUuid: string;
};
