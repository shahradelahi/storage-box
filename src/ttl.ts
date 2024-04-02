import type { HashField } from '@/typings.ts';

export type TTL = {
  type: 'key' | 'list' | 'hash';
  dat: number;
} & (
  | {
      type: 'key';
    }
  | {
      type: 'list';
      index: number;
    }
  | {
      type: 'hash';
      field: HashField;
    }
);

export type SerializedTTL = { key: string } & TTL;
