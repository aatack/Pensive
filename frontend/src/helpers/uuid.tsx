import { v4 } from "uuid";

export const generateUuid = () =>
  v4()
    .toString()
    .split("")
    .filter((character) => character !== "-")
    .join("");
