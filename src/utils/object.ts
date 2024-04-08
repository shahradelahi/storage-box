export function toMap<T extends string | number | symbol = any, U = any>(
  object: Record<T, U> | object
): Map<T, U> {
  const map = new Map();
  Object.entries(object).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
}

export function fromMap<T extends string | number | symbol, U>(map: Map<T, U>): Record<T, U> {
  const record = {} as Record<T, U>;
  map.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function removeUndefined<T extends object>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
