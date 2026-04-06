import { atom, useAtom } from "jotai";

const countAtom = atom(1);

export const useAtomTest = () => {
  const [count, setCount] = useAtom(countAtom);

  return [count, () => setCount((c) => c + 1)] as const;
};
