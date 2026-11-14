/**
 * Checks if an object has its own property.
 * @example
 * hasOwn({ a: 1 }, 'a'); // true
 */
export function hasOwn(obj: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Defines an own property on an object.
 * @example
 * defineOwn({}, 'a', 1);
 */
export function defineOwn<T extends object>(obj: T, key: PropertyKey, value: unknown): void {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/**
 * Converts an object or record to a Map.
 * @example
 * toMap({ a: 1 });
 */
export function toMap<T extends string | number | symbol = any, U = any>(
  object: Record<T, U> | object
): Map<T, U> {
  const map = new Map();
  Object.entries(object).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
}

/**
 * Converts a Map to a plain record object.
 * @example
 * fromMap(new Map([['a', 1]]));
 */
export function fromMap<T extends string | number | symbol, U>(map: Map<T, U>): Record<T, U> {
  const record = {} as Record<T, U>;
  map.forEach((value, key) => {
    defineOwn(record, key, value);
  });
  return record;
}

/**
 * Removes properties with undefined values from an object.
 * @example
 * removeUndefined({ a: 1, b: undefined });
 */
export function removeUndefined<T extends object>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      defineOwn(result, key, value);
    }
  }
  return result;
}

/**
 * Converts an object or Map to a plain object.
 * @example
 * toPlainObject(new Map([['a', 1]]));
 */
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
