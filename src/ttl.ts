export type TTL = {
  type: 'key' | 'list';
  dat: number;
} & (
  | {
      type: 'key';
    }
  | {
      type: 'list';
      index: number;
    }
);

export type SerializedTTL = { key: string } & TTL;
