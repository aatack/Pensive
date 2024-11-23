import { useEffect, useState } from "react";

export const useHistory = <T,>(value: T): T[] => {
  const [history, setHistory] = useState<T[]>([]);

  useEffect(() => setHistory((current) => [...current, value]), [value]);

  return history;
};
