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
export interface HashOperations {
  hget(key: string, field: HashField): Serializable | null;
  hset(key: string, field: HashField, value: Serializable): void;
  hsetex(key: string, field: HashField, value: Serializable, seconds: number): void;
  hdel(key: string, field: HashField): void;
  hexists(key: string, field: HashField): boolean;
  hsize(key: string): number;
  hclear(key: string): void;
  hgetall(key: string): HashRecord;
}

/**
 * List operations
 */
export interface ListOperations<Value extends HashValue = HashValue> {
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
