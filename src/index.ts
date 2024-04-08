export { Client } from './client.ts';

// -----------

export { default as MemoryDriver } from './driver/memory.ts';

export { default as FsDriver } from './driver/fs.ts';
export type { FsOptions } from './driver/fs.ts';

export { default as BrowserDriver } from './driver/browser.ts';

// -----------

export { JsonMap } from '@/parser/json-map.ts';
export { MSGPack } from '@/parser/msg-pack.ts';

// -----------

export function isBase64(data: any): boolean {
  return (
    typeof data === 'string' &&
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/i.test(data)
  );
}

export * as ObjectUtil from '@/utils/object.ts';

// -----------

export type * from '@/typings.ts';
