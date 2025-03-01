import { default as _MSGPack } from '@se-oss/msgpack';

import type { Serializable } from '@/typings';
import { toMap, toPlainObject } from '@/utils/object';

export class MSGPack {
  public static parse(data: any): Map<string, Serializable> {
    const decoded = _MSGPack.parse(data) as object;
    return toMap(decoded);
  }

  public static stringify(data: any): string {
    return _MSGPack.stringify(toPlainObject(data));
  }
}
