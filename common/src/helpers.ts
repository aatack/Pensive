/**
 * A couple of helper functions, including aliases for serialising and
 * deserialising objects for efficient storage in the database.
 */

import { parse, stringify, v4 } from "uuid";

export type Json =
  | Json[]
  | { [key: string]: Json }
  | string
  | number
  | boolean
  | null;

export type Uuid = string;

export const generateUuid = (): Uuid => v4();

export const serialiseUuid = (uuid: Uuid): Buffer => Buffer.from(parse(uuid));

export const deserialiseUuid = (uuid: Buffer): Uuid => stringify(uuid);

export const serialiseTimestamp = (timestamp: Date): number =>
  Math.floor(timestamp.getTime());

export const deserialiseTimestamp = (timestamp: number): Date =>
  new Date(timestamp);
