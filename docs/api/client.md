## `Client`

#### `constructor(options?: ClientOptions)`

Creates a new instance of the `Client` class.

#### `key: string, value: JsonValue | null): void`

Sets a value for a given key.

#### `setex(key: string, value: any, seconds: number): void`

Sets a value for a given key with a time-based expiration.

#### `get(key: string): JsonValue | null`

Gets a value for a given key.

#### `del(key: string): void`

Deletes a value for a given key.

#### `clear(): void`

Clears all values.

#### `keys(): string[]`

Gets all keys.

#### `list(): JsonArray`

Gets all key-value pairs.

#### `lset(key: string, index: number, value: JsonValue | null): void`

Sets a value for a given index in a list.

#### `lsetex(key: string, index: number, value: any, seconds: number): void`

Sets a value for a given index in a list with a time-based expiration.

#### `lget(key: string, index: number): JsonValue | null`

Gets a value for a given index in a list.

#### `lpush(key: string, value: any): void`

Pushes a value to the end of a list.

#### `lpop(key: string): JsonValue | undefined`

Pops a value from the end of a list.

#### `lsize(key: string): number`

Gets the size of a list.

#### `lclear(key: string): void`

Clears a list.

#### `lrange(key: string, start: number, end: number): JsonArray`

Gets a range of values from a list.

#### `ttl(key: string): number`

Gets the time to live for a key. Returns `-1` if the key already expired or does not exist.
