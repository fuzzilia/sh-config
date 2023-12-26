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

export async function waitAsync(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

export function errorToMessage(error: unknown): string {
  if (!isRecord(error)) {
    return '不明なエラーが発生しました。';
  }
  return typeof error.message === 'string' ? error.message : '不明なエラーが発生しました。';
}
