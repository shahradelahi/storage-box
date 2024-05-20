import type { Serializable } from '@/typings';
import { toMap, toPlainObject } from '@/utils/object';

export class JsonMap {
  public static parse(data: any): Map<string, Serializable> {
    if (data instanceof Map) {
      return data;
    }
    if (['object', 'string'].indexOf(typeof data) === -1) {
      throw new TypeError('data must be an object or a string');
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return toMap(parsed);
  }

  public static stringify(data: any): string {
    if (typeof data !== 'object') {
      throw new TypeError('data must be an object');
    }
    return JSON.stringify(toPlainObject(data));
  }
}
