import type { JsonValue } from 'type-fest';

// ---------------------

export type StorageOperations = KVOperations &
  HashOperations &
  ListOperations & {
    ttl(key: string): number;
  };

export interface KVOperations<
  Key extends HashField = string,
  Value extends HashValue = Serializable,
> {
  get(key: Key): Value | null;
  set(key: Key, value: Value | null): void;
  setex(key: Key, value: Value, seconds: number): void;
  del(key: Key): void;
  exists(key: Key): boolean;
  has(key: Key): boolean;
  keys(): Key[];
  values(): Value[];
  clear(): void;
  getall(): HashRecord<Key, Value>;
}

/**
 * Hash operations
 */
export interface HashOperations<
  Field extends HashField = HashField,
  Value extends Serializable = Serializable,
> {
  hget(key: string, field: Field): Value | null;
  hset(key: string, field: Field, value: Value): void;
  hsetex(key: string, field: Field, value: Value, seconds: number): void;
  hdel(key: string, field: Field): void;
  hexists(key: string, field: Field): boolean;
  hsize(key: string): number;
  hclear(key: string): void;
  hgetall(key: string): HashRecord;
}

/**
 * List operations
 */
export interface ListOperations<Value extends Serializable = Serializable> {
  lset(key: string, index: number, value: Value | null): void;
  lsetex(key: string, index: number, value: Value, seconds: number): void;
  lget(key: string, index: number): Value | null;
  ldel(key: string, index: number): void;
  lpush(key: string, value: Value): void;
  lpop(key: string): Value | null;
  lsize(key: string): number;
  lclear(key: string): void;
  lrange(key: string, start: number, stop: number): Value[];
  lgetall(key: string): Value[];
}

export interface StorageDriver<
  Key extends HashField = HashField,
  Value extends HashValue = HashValue,
> {
  get(key: Key): Value | null;
  set(key: Key, value: Value): void;
  del(key: Key): void;
  exists(key: Key): boolean;
  keys(): Key[];
  values(): Value[];
  clear(): void;
}

export interface IStorageParser {
  stringify(value: any): string;
  parse(value: any): Map<string, Serializable>;
}

export type ParserStringifyFn = (value: any) => string;
export type ParserParseFn = (value: any) => Map<string, Serializable>;

// ---------------------

export type HashField = string | number;
export type HashValue = Serializable | SerializableList;

/** Alias to `HashField` */
export type HashKey = HashField;

export type HashRecord<
  Key extends string | number | symbol = HashField,
  Value extends Serializable | SerializableList = HashValue,
> = {
  [key in Key]: Value;
};

// ---------------------

/** Alias to JSON-compatible values. */
export type Serializable = JsonValue | Serializable[];

/** Alias to a list of JSON-compatible values. */
export type SerializableList = Serializable[];

// ---------------------

export type { JsonPrimitive, JsonArray, JsonValue, JsonObject, Jsonify, Class } from 'type-fest';
