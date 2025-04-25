import { EntityState } from "../components/entity/entity";
import { server } from "../constants";
import { sort } from "../helpers/sorting";

export type Metadata = { root: string };

export const pensiveMetadata = async (): Promise<Metadata> =>
  fetch(`${server}/metadata`, {})
    .then((response) => response.json())
    .then(({ data }) => data);

export const pensiveRead = async (uuid: string): Promise<EntityState> =>
  fetch(`${server}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid }),
  })
    .then((response) => response.json())
    .then(({ data }) => data);

export const pensiveWrite = async (
  timestamp: Date,
  entities: { [uuid: string]: { [key: string]: any } },
  resources: { [uuid: string]: Blob }
): Promise<"OK"> => {
  const resourceUuids = sort(Object.keys(resources), (uuid) => uuid);

  const form = new FormData();
  form.append("timestamp", timestamp.toISOString());
  form.append("entities", JSON.stringify(entities));
  form.append("resource_uuids", JSON.stringify(resourceUuids));
  resourceUuids.forEach((uuid) =>
    form.append("resource_blobs", resources[uuid]!)
  );

  return fetch(`${server}/write`, { method: "POST", body: form })
    .then((response) => response.json())
    .then(({ data }) => data);
};

export const pensiveReadResource = async (uuid: string) => {
  return fetch(`${server}/read-resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid }),
  })
    .then(({ body }: { body: ReadableStream | null }) => body)
    .then((stream) => new Response(stream))
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob));
};
