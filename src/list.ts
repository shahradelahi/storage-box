import { Client } from '@/client';
import type { HashKey, HashValue } from '@/typings';

export class List<Value extends HashValue = HashValue> {
  constructor(
    private readonly _client: Client,
    private readonly _key: HashKey
  ) {}

  [Symbol.asyncIterator]() {
    const pList = this.list();
    return (async function* (): AsyncGenerator<Value> {
      for (const item of await pList) {
        yield item;
      }
    })();
  }

  set(index: number, value: Value | null): Promise<void> {
    return this._client.lset(this._key, index, value);
  }

  setex(index: number, value: Value, seconds: number): Promise<void> {
    return this._client.lsetex(this._key, index, value, seconds);
  }

  get(index: number): Promise<Value | null> {
    return this._client.lget(this._key, index) as Promise<Value | null>;
  }

  del(index: number): Promise<void> {
    return this._client.ldel(this._key, index);
  }

  push(value: Value): Promise<void> {
    return this._client.lpush(this._key, value);
  }

  pushex(value: Value, seconds: number): Promise<void> {
    return this._client.lpushex(this._key, value, seconds);
  }

  exists(value: Value): Promise<boolean> {
    return this._client.lexists(this._key, value);
  }

  pop(): Promise<Value | null> {
    return this._client.lpop(this._key) as Promise<Value | null>;
  }

  size(): Promise<number> {
    return this._client.lsize(this._key);
  }

  clear(): Promise<void> {
    return this._client.lclear(this._key);
  }

  range(start: number, stop: number): Promise<Value[]> {
    return this._client.lrange(this._key, start, stop) as Promise<Value[]>;
  }

  list(): Promise<Value[]> {
    return this._client.lgetall(this._key) as Promise<Value[]>;
  }

  toArray(): Promise<Value[]> {
    return this.list();
  }
}
