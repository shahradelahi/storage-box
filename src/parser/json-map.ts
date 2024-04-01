import type { Serializable } from '@/typings.ts';

export class JsonMap {
  static parse(data: any): Map<string, Serializable> {
    if (data instanceof Map) {
      return data;
    }
    if (['object', 'string'].indexOf(typeof data) === -1) {
      throw new Error('data must be an object or a string');
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const hashMap = new Map<string, Serializable>();
    Object.entries(parsed).forEach(([k, v]) => {
      hashMap.set(k, v as any);
    });
    return hashMap;
  }

  static stringify(data: any): string {
    const obj = Object.fromEntries(data);
    return JSON.stringify(obj);
  }
}
