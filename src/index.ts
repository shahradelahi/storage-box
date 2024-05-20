export { Client } from './client';
export { HashMap } from './hash-map';

// -----------

export { default as MemoryDriver } from './driver/memory';

// -----------

export { JsonMap } from '@/parser/json-map';
export { MSGPack } from '@/parser/msg-pack';

// -----------

export function isBase64(data: any): boolean {
  return (
    typeof data === 'string' &&
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/i.test(data)
  );
}

export * as ObjectUtil from '@/utils/object';

// -----------

export type * from '@/typings';
