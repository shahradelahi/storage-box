# Memory-based Storage (Default)

On this page, you can find examples of using the memory-based driver.

### Table of Contents

- [Usage](#usage)
- [Key/Value Operations](#keyvalue-operations)
  - [Set](#set)
  - [Get](#get)
  - [Delete](#delete)
  - [Clear](#clear)
  - [Exists/Has](#existshas)
  - [Size](#size)
  - [Keys](#keys)
- [Time-based Key Expiration](#time-based-key-expiration)
  - [Setex](#setex)
  - [Ttl](#ttl)

### Usage

This is the default diver for the `storage-box` package and no further configuration is required.

```typescript
import { Client } from 'storage-box';

const client = new Client();
```

### Key/Value Operations

##### Set

```typescript
await client.set('key', 'value');
```

##### Get

```typescript
const value = await client.get('key');
```

##### Delete

```typescript
await client.del('key');
```

##### Clear

```typescript
await client.clear();
```

##### Exists/Has

```typescript
const exists = await client.exists('key');
const has = await client.has('key'); // has is an alias for exists
```

##### Size

Length of the storage

```typescript
const size = await client.size();
```

##### Keys

```typescript
const keys = await client.keys();
```

### Time-based Key Expiration

##### Setex

```typescript
await client.setex('key', 'value', 10); // 10 seconds
```

##### Ttl

Returns the remaining time in seconds

```typescript
const ttl = await client.ttl('key');
const ttlMs = await client.ttl('key', true); // Returns the remaining time in milliseconds
```
