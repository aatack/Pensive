import { EntityState } from "../components/entity/entity";
import { PensiveWrite } from "../components/pensive";
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

export const pensiveWrite = async (write: PensiveWrite): Promise<"OK"> => {
  const resourceUuids = sort(Object.keys(write.resources), (uuid) => uuid);

  const form = new FormData();
  form.append("timestamp", write.timestamp.toISOString());
  form.append("entities", JSON.stringify(write.entities));
  form.append("resource_uuids", JSON.stringify(resourceUuids));
  resourceUuids.forEach((uuid) => {
    const blob = write.resources[uuid];
    if (blob != null) {
      form.append("resource_blobs", blob);
    }
  });

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

export const pensivePrompt = async (prompt: string) => {
  return fetch(`${server}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
    .then((response) => response.json())
    .then(({ data }) => data);
};

export const pensiveUndo = async (timestamp: Date) =>
  fetch(`${server}/undo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp: timestamp.toISOString() }),
  })
    .then((response) => response.json())
    .then(({ data }) => data);
