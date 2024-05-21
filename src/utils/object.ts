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

export function toPlainObject<T extends object>(obj: T): T {
  const newObj = {} as T;
  if (typeof obj !== 'object') {
    throw new TypeError('Cannot convert ' + typeof obj + ' to object');
  }

  if (obj instanceof Map) {
    return fromMap(obj);
  }

  for (const [key, value] of Object.entries(obj)) {
    Object.defineProperty(newObj, key, {
      value,
      enumerable: true,
      configurable: true,
    });
  }

  return newObj;
}
