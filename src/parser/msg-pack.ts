import { decode, encode } from '@msgpack/msgpack';

import type { Serializable } from '@/typings';
import { toMap, toPlainObject } from '@/utils/object';

export class MSGPack {
  public static parse(data: any): Map<string, Serializable> {
    if (typeof data !== 'string') {
      throw new TypeError('MessagePack data must be a string encoded in base64');
    }
    const buffer = Buffer.from(data, 'base64');
    const decoded = decode(buffer);

    if (!decoded || typeof decoded !== 'object') {
      throw new TypeError('Malformed MessagePack data');
    }

    return toMap(decoded);
  }

  public static stringify(data: any): string {
    if (typeof data !== 'object') {
      throw new TypeError('data must be an object');
    }
    const encoded = encode(toPlainObject(data));
    const buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    return buffer.toString('base64');
  }
}
