export function hasOwn(obj: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function defineOwn<T extends object>(obj: T, key: PropertyKey, value: unknown): void {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

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
    defineOwn(record, key, value);
  });
  return record;
}

export function removeUndefined<T extends object>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      defineOwn(result, key, value);
    }
  }
  return result;
}

export function toPlainObject<T extends object>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('Cannot convert ' + typeof obj + ' to object');
  }

  if (obj instanceof Map) {
    return fromMap(obj);
  }

  const newObj = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    defineOwn(newObj, key, value);
  }

  return newObj;
}
