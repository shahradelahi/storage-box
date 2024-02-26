import type { Serializable } from '@/typings.ts';
import { decode, encode } from '@msgpack/msgpack';

export function parse(data: any): Map<string, Serializable> {
  if (typeof data !== 'string') {
    throw new Error('MessagePack data must be a string');
  }
  const buffer = Buffer.from(data, 'base64');
  const decoded = decode(buffer);

  if (typeof decoded !== 'object') {
    throw new Error('MessagePack data must be an object');
  }

  return new Map(Object.entries(decoded as object));
}

export function stringify(data: any): string {
  if (!(data instanceof Map)) {
    throw new Error('MessagePack data must be a Map');
  }
  const obj = Object.fromEntries(data);
  const encoded = encode(obj);
  const buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
  return buffer.toString('base64');
}
