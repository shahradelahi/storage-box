import { default as _MSGPack } from '@se-oss/msgpack';

import type { Serializable } from '@/typings';
import { toMap, toPlainObject } from '@/utils/object';

/**
 * MessagePack parser utility for serializing and parsing maps.
 */
export class MSGPack {
  /**
   * Parses MessagePack binary data into a Map.
   * @example
   * MSGPack.parse(buffer);
   */
  public static parse(data: any): Map<string, Serializable> {
    const decoded = _MSGPack.parse(data) as object;
    return toMap(decoded);
  }

  /**
   * Stringifies data into MessagePack binary format.
   * @example
   * MSGPack.stringify(new Map([['a', 1]]));
   */
  public static stringify(data: any): string {
    return _MSGPack.stringify(toPlainObject(data));
  }
}
