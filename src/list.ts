import { Client } from '@/client';
import type { HashKey, HashValue } from '@/typings';

export class List<Value extends HashValue = HashValue> {
  constructor(
    private readonly _client: Client,
    private readonly _key: HashKey
  ) {}

  [Symbol.iterator]() {
    const list = this.toArray();
    return (function* (): Generator<Value> {
      for (const item of list) {
        yield item;
      }
    })();
  }

  set(index: number, value: Value | null): void {
    return this._client.lset(this._key, index, value);
  }

  setex(index: number, value: Value, seconds: number): void {
    return this._client.lsetex(this._key, index, value, seconds);
  }

  get(index: number): Value | null {
    return this._client.lget(this._key, index) as Value | null;
  }

  del(index: number): void {
    return this._client.ldel(this._key, index);
  }

  push(value: Value): void {
    return this._client.lpush(this._key, value);
  }

  pushex(value: Value, seconds: number): void {
    return this._client.lpushex(this._key, value, seconds);
  }

  exists(value: Value): boolean {
    return this._client.lexists(this._key, value);
  }

  pop(): Value | null {
    return this._client.lpop(this._key) as Value | null;
  }

  size(): number {
    return this._client.lsize(this._key);
  }

  clear(): void {
    return this._client.lclear(this._key);
  }

  range(start: number, stop: number): Value[] {
    return this._client.lrange(this._key, start, stop) as Value[];
  }

  list(): Value[] {
    return this._client.lgetall(this._key) as Value[];
  }

  toArray(): Value[] {
    return this.list();
  }
}
