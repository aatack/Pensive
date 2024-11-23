import equal from "fast-deep-equal";

/**
 * Slow wrapper around standard records with additional functionality.
 */
export type Mapping<K extends string | number | symbol, V> = {
  default: V;
  mapping: { [key in K]: V };
};

export const mappingGet = <K extends string | number | symbol, V>(
  mapping: Mapping<K, V>,
  key: K
): V => mapping.mapping[key] ?? mapping.default;

export const mappingUpdate = <K extends string | number | symbol, V>(
  mapping: Mapping<K, V>,
  key: K,
  update: (value: V) => V
): Mapping<K, V> => ({
  ...mapping,
  mapping: { ...mapping.mapping, [key]: update(mappingGet(mapping, key)) },
});

export const mappingFlush = <K extends string | number | symbol, V>(
  mapping: Mapping<K, V>
): Mapping<K, V> => ({
  ...mapping,
  mapping: Object.fromEntries(
    Object.entries(mapping.mapping).filter(
      ([_, value]) => !equal(value, mapping.default)
    )
  ) as { [key in K]: V },
});
