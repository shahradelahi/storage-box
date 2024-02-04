import type { JsonArray, JsonValue } from 'type-fest';
import { JsonPrimitive } from 'type-fest/source/basic';

export interface IStorageBox {
  get(key: string): JsonValue | null;
  set(key: string, value: JsonValue | null): void;
  del(key: string): void;
  list(key: string): JsonArray;
  lset(key: string, index: number, value: JsonValue | null): void;
  lget(key: string, index: number): JsonValue | null;
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

export interface IStorageParser {
  stringify(value: any): string;
  parse(value: any): Map<string, JsonValue>;
}

export type CommonDriverOptions = {
  // Parser to use for serializing and deserializing data. Defaults to JSON.
  parser?: IStorageParser;
  // Bounce time for debouncing write operations
  debounceTime?: number;
};

export type StorageType = 'local' | 'session';

export type { JsonArray, JsonPrimitive, JsonValue };
