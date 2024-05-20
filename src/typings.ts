export type StorageOperations = KVOperations &
  HashOperations &
  ListOperations & {
    ttl(key: string): Promise<number>;
  };

export interface KVOperations<
  Key extends HashField = string,
  Value extends HashValue = Serializable,
> {
  get(key: Key): Promise<Value | null>;
  set(key: Key, value: Value | null): Promise<void>;
  setex(key: Key, value: Value, seconds: number): Promise<void>;
  del(key: Key): Promise<void>;
  exists(key: Key): Promise<boolean>;
  has(key: Key): Promise<boolean>;
  keys(): Promise<Key[]>;
  values(): Promise<Value[]>;
  clear(): Promise<void>;
  getall(): Promise<HashRecord<Key, Value>>;
}

/**
 * Hash operations
 */
export interface HashOperations {
  hget(key: string, field: HashField): Promise<Serializable | null>;
  hset(key: string, field: HashField, value: Serializable): Promise<void>;
  hsetex(key: string, field: HashField, value: Serializable, seconds: number): Promise<void>;
  hdel(key: string, field: HashField): Promise<void>;
  hexists(key: string, field: HashField): Promise<boolean>;
  hsize(key: string): Promise<number>;
  hclear(key: string): Promise<void>;
  hgetall(key: string): Promise<HashRecord>;
}

/**
 * List operations
 */
export interface ListOperations<Value extends HashValue = HashValue> {
  lset(key: string, index: number, value: Value | null): Promise<void>;
  lsetex(key: string, index: number, value: Value, seconds: number): Promise<void>;
  lget(key: string, index: number): Promise<Value | null>;
  ldel(key: string, index: number): Promise<void>;
  lpush(key: string, value: Value): Promise<void>;
  lpop(key: string): Promise<Value | null>;
  lsize(key: string): Promise<number>;
  lclear(key: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<Value[]>;
  lgetall(key: string): Promise<Value[]>;
}

export interface StorageDriver<
  Key extends HashField = HashField,
  Value extends HashValue = HashValue,
> {
  prepare?(): Promise<void>;
  get(key: Key): Promise<Value | null>;
  set(key: Key, value: Value): Promise<void>;
  del(key: Key): Promise<void>;
  exists(key: Key): Promise<boolean>;
  keys(): Promise<Key[]>;
  values(): Promise<Value[]>;
  clear(): Promise<void>;
}

export interface IStorageParser {
  stringify(value: any): string;
  parse(value: any): Map<string, Serializable>;
}

export type StorageState = 'pending' | 'ready';

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

export type ParserStringifyFn = (value: any) => string;
export type ParserParseFn = (value: any) => Map<string, Serializable>;

// ---------------------

export type Class<T> = new (...args: any[]) => T;

// ---------------------

/**
 Matches a JSON object.

 This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. Don't use this as a direct return type as the user would have to double-cast it: `jsonObject as unknown as CustomResponse`. Instead, you could extend your CustomResponse type from it to ensure your type only uses JSON-compatible types: `interface CustomResponse extends JsonObject { … }`.

 @category JSON
 */
export type JsonObject = { [Key in string]: JsonValue } & {
  [Key in string]?: JsonValue | undefined;
};

/**
 Matches a JSON array.

 @category JSON
 */
export type JsonArray = JsonValue[] | readonly JsonValue[];

/**
 Matches any valid JSON primitive value.

 @category JSON
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 Matches any valid JSON value.

 @see `Jsonify` if you need to transform a type to one that is assignable to `JsonValue`.

 @category JSON
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Alias to JSON-compatible values. */
export type Serializable = JsonPrimitive | JsonArray | JsonValue | JsonObject;

/** Alias to a list of JSON-compatible values. */
export type SerializableList = Serializable[];
