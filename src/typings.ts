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
  // Hash
  ///
  hget(key: string, field: HashField): Promise<Serializable | null>;
  hset(key: string, field: HashField, value: Serializable): Promise<void>;
  hsetex(key: string, field: HashField, value: Serializable, seconds: number): Promise<void>;
  hdel(key: string, field: HashField): Promise<void>;
  hexists(key: string, field: HashField): Promise<boolean>;
  hsize(key: string): Promise<number>;
  hclear(key: string): Promise<void>;
  hgetall(key: string): Promise<HashRecord>;

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

// ---------------------

export type HashField = string | number;
export type HashRecord = Record<HashField, Serializable>;

// ---------------------

export type ParserStringifyFn = (value: any) => string;
export type ParserParseFn = (value: any) => Map<string, Serializable>;

// ---------------------

export type StorageType = 'local' | 'session';

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
