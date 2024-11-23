export const deserialiseSnapshot = (snapshot: string): [number, number] => {
  // For some reason, you need to write out the full function here.  Writing
  // `.map(parseInt)` gives errors when the second segment is `"1"`
  const segments = snapshot.split("-").map((value) => parseInt(value));
  return [segments[0]!, segments[1] ?? 0];
};

export const serialiseSnapshot = (snapshot: [number, number]): string =>
  snapshot[0].toString() +
  (snapshot[1] === 0 ? "" : "-" + snapshot[1].toString());
