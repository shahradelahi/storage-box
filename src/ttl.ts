import type { HashField } from '@/typings';

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

export type SerializedTTL = { key: HashField } & TTL;
