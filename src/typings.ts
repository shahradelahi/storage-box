import type { JsonArray, JsonObject, JsonValue, JsonPrimitive } from 'type-fest';

export interface IOperations<Driver extends IStorageDrive> {
  ///
  // Basic key-value operations
  ///
  get(key: string): Promise<Serializable | null>;
  set(key: string, value: Serializable | null): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;

  ///
  // List
  ///
  list(key: string): Promise<SerializableList>;
  lset(key: string, index: number, value: Serializable | null): Promise<void>;
  lget(key: string, index: number): Promise<Serializable | null>;
  ldel(key: string, index: number): Promise<void>;
  lpush(key: string, value: Serializable): Promise<void>;
  lpop(key: string): Promise<Serializable | undefined>;
  lsize(key: string): Promise<number>;
  lclear(key: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<SerializableList>;

  ///
  // Timed keys
  ///
  setex(key: string, value: Serializable, seconds: number): Promise<void>;
  lsetex(key: string, index: number, value: Serializable, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
}

export interface IStorageDrive {
  prepare?(): Promise<void>;

  get(key: string): Promise<Serializable | SerializableList | undefined>;
  set(key: string, value: Serializable | SerializableList): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

export interface IStorageParser {
  stringify(value: any): string;
  parse(value: any): Map<string, Serializable>;
}

export type StorageState = 'pending' | 'ready';

export type ParserStringifyFn = (value: any) => string;
export type ParserParseFn = (value: any) => Map<string, Serializable>;

export type StorageType = 'local' | 'session';

export type { JsonArray, JsonPrimitive, JsonValue, JsonObject };

export type Serializable = JsonPrimitive | JsonArray | JsonValue | JsonObject;

export type SerializableList = Serializable[];
