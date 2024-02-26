import type { JsonArray, JsonObject, JsonValue } from 'type-fest';
import { JsonPrimitive } from 'type-fest/source/basic';

export interface IStorageBox {
  /**
   * Basic key-value operations
   */
  get(key: string): Serializable | null;
  set(key: string, value: Serializable | null): void;
  del(key: string): void;
  exists(key: string): boolean;
  has(key: string): boolean;
  keys(): string[];
  clear(): void;

  /**
   * List
   */
  list(key: string): SerializableList;
  lset(key: string, index: number, value: Serializable | null): void;
  lget(key: string, index: number): Serializable | null;
  ldel(key: string, index: number): void;
  lpush(key: string, value: Serializable): void;
  lpop(key: string): Serializable | undefined;
  lsize(key: string): number;
  lclear(key: string): void;
  lrange(key: string, start: number, stop: number): SerializableList;

  /**
   * Timed keys
   */
  setex(key: string, value: Serializable, seconds: number): void;
  lsetex(key: string, index: number, value: Serializable, seconds: number): void;
  ttl(key: string): number;
}

export interface IStorageDrive {
  get(key: string): Serializable | undefined;
  set(key: string, value: Serializable): void;
  del(key: string): void;
  exists(key: string): boolean;
  keys(): string[];
  clear(): void;
}

export interface IStorageParser {
  stringify(value: any): string;
  parse(value: any): Map<string, Serializable>;
}

export type ParserStringifyFn = (value: any) => string;
export type ParserParseFn = (value: any) => Map<string, Serializable>;

export type CommonDriverOptions = {
  // Parser to use for serializing and deserializing data. Defaults to JSON.
  parser?: IStorageParser;
  // Bounce time for debouncing write operations
  debounceTime?: number;
};

export type StorageType = 'local' | 'session';

export type { JsonArray, JsonPrimitive, JsonValue, JsonObject };

export type Serializable = JsonPrimitive | JsonArray | JsonValue | JsonObject;

export type SerializableList = Serializable[];
