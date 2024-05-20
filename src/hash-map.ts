import { Client } from '@/client';
import type { HashField, HashRecord, HashValue, KVOperations } from '@/typings';

export class HashMap<Key extends HashField = HashField, Value extends HashValue = HashValue>
  implements KVOperations<Key, Value>
{
  constructor(
    private readonly _client: Client,
    private readonly _key: string
  ) {}

  get(key: Key): Promise<Value | null> {
    return this._client.hget(this._key, key) as any;
  }

  set(key: Key, value: Value): Promise<void> {
    return this._client.hset(this._key, key, value);
  }

  setex(key: Key, value: Value, seconds: number): Promise<void> {
    return this._client.hsetex(this._key, key, value, seconds);
  }

  del(key: Key): Promise<void> {
    return this._client.hdel(this._key, key);
  }

  exists(key: Key): Promise<boolean> {
    return this._client.hexists(this._key, key);
  }

  has(key: Key): Promise<boolean> {
    return this._client.hexists(this._key, key);
  }

  keys(): Promise<Key[]> {
    return this._client.hkeys(this._key) as Promise<Key[]>;
  }

  values(): Promise<Value[]> {
    return this._client.hvalues(this._key) as Promise<Value[]>;
  }

  clear(): Promise<void> {
    return this._client.hclear(this._key);
  }

  getall(): Promise<HashRecord<Key, Value>> {
    return this._client.hgetall(this._key);
  }
}
