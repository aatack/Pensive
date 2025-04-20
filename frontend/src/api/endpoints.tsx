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

export const pensiveSave = async (): Promise<boolean> =>
  fetch(`${server}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((response) => response.json());

export const pensiveRead = async (read: Read): Promise<EntityState> =>
  fetch(`${server}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(read),
  })
    .then((response) => response.json())
    .then(({ data }) => data);

export type Write = {
  timestamp: string;
  entities: { [uuid: string]: { [key: string]: any } };
};

export const pensiveWrite = async (
  note: string,
  inputs: { [timestamp: string]: { [trait: string]: any } },
  resources: { [name: string]: Blob }
): Promise<{ [timestamp: string]: { [trait: string]: any } }> => {
  const names = sort(Object.keys(resources), (name) => name);

  const form = new FormData();
  form.append("note", note);
  form.append("inputs", JSON.stringify(inputs));
  form.append("resource_uuids", JSON.stringify(names));
  names.forEach((name) => form.append("resource_blobs", resources[name]!));

  return fetch(`${server}/write`, { method: "POST", body: form })
    .then((response) => response.json())
    .then(({ data }) => data);
};

export const pensiveReadResource = async (note: string, name: string) => {
  return fetch(`${server}/read-resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, name }),
  })
    .then(({ body }: { body: ReadableStream | null }) => body)
    .then((stream) => new Response(stream))
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob));
};
