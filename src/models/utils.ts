export function replaceAt<T>(values: readonly T[], newValue: T, at: number): T[] {
  const newValues = [...values];
  newValues[at] = newValue;
  return newValues;
}

export function scalarArrayEquals<T extends number | string>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((v, i) => v === b[i]);
}
