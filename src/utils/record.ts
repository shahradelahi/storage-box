export function mapToRecord<T extends string | number | symbol, U>(map: Map<T, U>): Record<T, U> {
  const record = {} as Record<T, U>;
  map.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function recordToMap<T extends string | number | symbol, U>(
  record: Record<T, U>
): Map<T, U> {
  const map = new Map<T, U>();
  Object.entries(record).forEach(([key, value]) => {
    map.set(key as T, value as U);
  });
  return map;
}
