import { EntityState } from "../components/entity/entity";
import { server } from "../constants";
import { sort } from "../helpers/sorting";

export type Metadata = { root: string | null };

export const pensiveMetadata = async (): Promise<Metadata> =>
  fetch(`${server}/metadata`, {})
    .then((response) => response.json())
    .then(({ data }) => data);

export type Read = {
  uuid: string;
};

export const pensiveRead = async (read: Read): Promise<EntityState> =>
  fetch(`${server}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(read),
  })
    .then((response) => response.json())
    .then(({ data }) => data);

export type Write = {
  timestamp: Date;
  entities: { [uuid: string]: { [key: string]: any } };
  resources: { [uuid: string]: Blob };
};

export const pensiveWrite = async (write: Write): Promise<"OK"> => {
  const resourceUuids = sort(Object.keys(write.resources), (uuid) => uuid);

  const form = new FormData();
  form.append("timestamp", write.timestamp.toISOString());
  form.append("entities", JSON.stringify(write.entities));
  form.append("resource_uuids", JSON.stringify(resourceUuids));
  resourceUuids.forEach((uuid) =>
    form.append("resource_blobs", write.resources[uuid]!)
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
