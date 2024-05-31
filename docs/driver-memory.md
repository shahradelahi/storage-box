# Memory-based Storage (Default)

On this page, you can find examples of using the memory-based driver.

## Table of Contents

- [Usage](#usage)
- [Key/Value Operations](#keyvalue-operations)
  - [set](#set)
  - [get](#get)
  - [getall](#getall)
  - [delete](#delete)
  - [clear](#clear)
  - [exists](#exists)
  - [size](#size)
  - [keys](#keys)
  - [values](#values)
- [Time-based Key Expiration](#time-based-key-expiration)
  - [setex](#setex)
  - [hsetex](#hsetex)
  - [lsetex](#lsetex)
  - [TTL](#ttl)
- [Hash Operations](#hash-operations)
  - [createHashMap](#createhashmap)
    - [abstract HashMap](#abstract-hashmap)
  - [hset](#hset)
  - [hget](#hget)
  - [hgetall](#hgetall)
  - [hkeys](#hkeys)
  - [hvalues](#hvalues)
  - [hdel](#hdel)
  - [hexists](#hexists)
  - [hsize](#hsize)
  - [hclear](#hclear)
- [List Operations](#list-operations)
  - [createList](#createlist)
    - [abstract List](#abstract-list)
  - [lpush](#lpush)
  - [lpop](#lpop)
  - [lrange](#lrange)
  - [lset](#lset)
  - [lrem](#lrem)
  - [lclear](#lclear)
  - [lsize](#lsize)
  - [lget](#lget)
  - [lgetall](#lgetall)

## Usage

This is the default diver of the `storage-box` package, No further configuration is required.

```typescript
import { Client } from 'storage-box';

const c = new Client();
```

## Key/Value Operations

##### set

```typescript
client.set('key', 'value');
```

##### get

```typescript
const value = client.get('key');
```

##### getall

```typescript
const objs = client.getall();
```

##### delete

```typescript
client.del('key');
```

##### clear

```typescript
client.clear();
```

##### exists

```typescript
const exists = client.exists('key');
const has = client.has('key'); // has is an alias for exists
```

##### size

Length of the storage

```typescript
const size = client.size();
```

##### keys

```typescript
const keys = client.keys();
```

##### values

```typescript
const values = client.values();
```

## Time-based Key Expiration

##### Setex

```typescript
client.setex('key', 'value', 10); // 10 seconds
```

##### TTL

Returns the remaining time in seconds

```typescript
const ttl = client.ttl('key');
const ttlMs = client.ttl('key', true); // Returns the remaining time in milliseconds
```

## Hash Operations

### createHashMap

```typescript
interface Vertex {
  x: number;
  y: number;
}

const hash = client.createHashMap<string, Vertex>();
```

#### Abstract HashMap

```typescript
import { expect } from 'chai';
import type { JsonObject } from 'storage-box';

interface CuteUser extends JsonObject {
  first: string;
  last: string;
}

class CuteMap extends HashMap<string, CuteUser> {
  async addUser(user: CuteUser) {
    const randId = Math.random().toString(36).slice(2);
    await this.set(randId, user);
  }

  async initials(): string[] {
    const all = await this.getall();
    return Object.values(all).map((u) => `${u.first[0]}${u.last[0]}`);
  }
}

const cuties = client.createHashMap(CuteMap);

await cuties.addUser({ first: 'Mary', last: 'Jane' });
await cuties.addUser({ first: 'Peter', last: 'Parker' });

const initials = await cuties.initials();
expect(initials).to.have.members(['MJ', 'PP']);
```

### hset

```typescript
client.hset('key', 'field', 'value');
```

### hget

```typescript
const value = client.hget('key', 'field');
```

### hgetall

```typescript
const map = client.hgetall('key');
```

### hsetex

```typescript
client.hsetex('key', 'field', 'value', 10); // 10 seconds
```

### hkeys

```typescript
const keys = client.hkeys('key');
```

### hvalues

```typescript
const values = client.hvalues('key');
```

### hdel

```typescript
client.hdel('key', 'field');
```

### hexists

```typescript
const exists = client.hexists('key', 'field');
```

### hsize

```typescript
const size = client.hsize('key');
```

### hclear

```typescript
client.hclear('key');
```
