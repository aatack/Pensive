import { useEffect, useState } from "react";
import { Mapping, mappingGet, mappingUpdate } from "./mapping";

export type Atom<T> = {
  value: T;
  swap: (update: (value: T) => T) => void;
  reset: (value: T) => void;
};

export const useAtom = <T,>(
  initialValue: T,
  verify?: (newValue: T, currentValue: T) => T
): Atom<T> => {
  const [value, setValue] = useState(
    verify ? verify(initialValue, initialValue) : initialValue
  );
  const swap = (update: (value: T) => T) =>
    setValue((current) => {
      if (verify == null) {
        return update(current);
      } else {
        return verify(update(current), current);
      }
    });
  const reset = (newValue: T) => swap(() => newValue);

  return { value, swap, reset };
};

export const usePersistentAtom = <T,>(
  key: string,
  initialValue: T,
  options?: { reset?: boolean; verify?: (newValue: T, currentValue: T) => T }
): Atom<T> => {
  const persistedValue = localStorage.getItem(key);
  const atom = useAtom(
    persistedValue == null || options?.reset
      ? initialValue
      : JSON.parse(persistedValue),
    options?.verify
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(atom.value));
  }, [atom.value]);

  return atom;
};

export const mapAtom = <T, U>(
  atom: Atom<T>,
  mapping: (value: T) => U,
  inverseMapping: (outerValue: T, innerValue: U) => T
): Atom<U> => {
  const value = mapping(atom.value);
  const swap = (update: (innerValue: U) => U) =>
    atom.swap((current) => inverseMapping(current, update(mapping(current))));
  const reset = (newValue: U) => swap(() => newValue);

  return { value, swap, reset };
};

export const cursor = <T, K extends keyof T>(
  atom: Atom<T>,
  key: K
): Atom<T[K]> => {
  const value = atom.value[key];
  const swap = (update: (value: T[K]) => T[K]) =>
    atom.swap((current) => ({
      ...current,
      [key]: update(current[key]),
    }));
  const reset = (newValue: T[K]) => swap(() => newValue);

  return { value, swap, reset };
};

export const mappingCursor = <K extends string | number | symbol, V>(
  atom: Atom<Mapping<K, V>>,
  key: K
): Atom<V> => {
  const value = mappingGet(atom.value, key);
  const swap = (update: (value: V) => V) =>
    atom.swap((current) => mappingUpdate(current, key, update));
  const reset = (newValue: V) => swap(() => newValue);

  return { value, swap, reset };
};

export const arrayCursor = <T,>(atom: Atom<T[]>, index: number): Atom<T> => {
  const value = atom.value[index] as T;
  const swap = (update: (value: T) => T) =>
    atom.swap((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? update(item) : item
      )
    );
  const reset = (newValue: T) => swap(() => newValue);

  return { value, swap, reset };
};

export const arrayCursors = <T,>(atom: Atom<T[]>): Atom<T>[] =>
  atom.value.map((_, index) => arrayCursor(atom, index));
