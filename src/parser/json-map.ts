import type { JsonValue } from 'type-fest';

export function parse(data: any): Map<string, JsonValue> {
  if (data instanceof Map) {
    return data;
  }
  if (['object', 'string'].indexOf(typeof data) === -1) {
    throw new Error('data must be an object or a string');
  }
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  const hashMap = new Map<string, JsonValue>();
  Object.entries(parsed).forEach(([k, v]) => {
    hashMap.set(k, v as any);
  });
  return hashMap;
}

export function stringify(data: any): string {
  const obj = Object.fromEntries(data);
  return JSON.stringify(obj);
}
