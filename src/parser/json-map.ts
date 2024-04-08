import type { Serializable } from '@/typings.ts';
import { toMap } from '@/utils/object.ts';

export class JsonMap {
  public static parse(data: any): Map<string, Serializable> {
    if (data instanceof Map) {
      return data;
    }
    if (['object', 'string'].indexOf(typeof data) === -1) {
      throw new Error('data must be an object or a string');
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return toMap(parsed);
  }

  public static stringify(data: any): string {
    if (typeof data !== 'object') {
      throw new Error('data must be an object');
    }
    const obj = Object.fromEntries(data);
    return JSON.stringify(obj);
  }
}
