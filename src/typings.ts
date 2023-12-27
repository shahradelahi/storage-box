import type { JsonArray, JsonValue } from 'type-fest';

export interface IStorageBox {
  get(key: string): JsonValue | undefined;
  set(key: string, value: JsonValue): void;
  del(key: string): void;
  list(key: string): JsonArray;
  lset(key: string, index: number, value: any): void;
  lget(key: string, index: number): JsonValue | undefined;
  ldel(key: string, index: number): void;
  lpush(key: string, value: JsonValue): void;
  lpop(key: string): JsonValue | undefined;
  lsize(key: string): number;
  lclear(key: string): void;
  lrange(key: string, start: number, stop: number): JsonArray;
  exists(key: string): boolean;
  setex(key: string, value: JsonValue, seconds: number): void;
  lsetex(key: string, index: number, value: any, seconds: number): void;
  ttl(key: string): number;
  keys(): string[];
  clear(): void;
}

export interface IStorageDrive {
  get(key: string): JsonValue | undefined;
  set(key: string, value: JsonValue): void;
  del(key: string): void;
  exists(key: string): boolean;
  keys(): string[];
  clear(): void;
}
