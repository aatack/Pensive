export const clamp = (value: number, minimum: number, maximum: number) =>
  value < minimum ? minimum : value > maximum ? maximum : value;
