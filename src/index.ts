import MemoryDriver from '@/driver/memory.ts';
import type { IStorageBox, IStorageDrive } from '@/typings.ts';
import type { JsonArray, JsonValue } from 'type-fest';

const TTL_LIST_KEY = '__TTL_LIST-DONT_USE__';

type TTL = {
  type: 'key' | 'list';
  dat: number;
} & (
  | {
      type: 'key';
    }
  | {
      type: 'list';
      index: number;
    }
);

type SerializedTTL = { key: string } & TTL;

export class Client implements IStorageBox {
  private _drive: IStorageDrive;
  private _ttl: Map<string, TTL> = new Map();

  constructor(storage?: IStorageDrive) {
    this._drive = storage || new MemoryDriver();
    this._load_ttl();
  }

  get(key: string): JsonValue | null {
    const ttl = this._ttl.get(key);

    // Return if ttl is not set or not expired
    if (!ttl || ttl.dat > Date.now()) {
      return this._drive.get(key) ?? null;
    }

    if (ttl.type === 'key') {
      this.del(key);
    }

    if (ttl.type === 'list') {
      // Delete key from TTL list due to TTL mismatch
      this._ttl.delete(key);
    }

    return null;
  }

  set(key: string, value: JsonValue | null): void {
    this._drive.set(key, value);
  }

  del(key: string): void {
    this._drive.del(key);
  }

  exists(key: string): boolean {
    return this._drive.exists(key);
  }

  keys(): string[] {
    return this._drive.keys();
  }

  clear(): void {
    this._drive.clear();
  }

  private _get_list(key: string): JsonValue[] {
    if (!this._drive.exists(key)) {
      this._drive.set(key, []);
    }

    const list = this._drive.get(key); // Not using this.get() to avoid TTL check
    if (!Array.isArray(list)) {
      throw new Error('Key is not a list or data is corrupted.');
    }

    return list;
  }

  list(key: string): JsonArray {
    return this._get_list(key);
  }

  lset(key: string, index: number, value: JsonValue | null): void {
    const list = this._get_list(key);
    list[index] = value;
    this._drive.set(key, list);
  }

  lget(key: string, index: number): JsonValue | null {
    const ttl = this._ttl.get(key);

    if (!ttl || ttl.dat > Date.now()) {
      const list = this._get_list(key);
      return list[index];
    }

    if (ttl.type === 'list') {
      this.lset(key, ttl.index, null);
    }

    if (ttl.type === 'key') {
      // TTL mismatch with the key, delete the key from the TTL list
      this._ttl.delete(key);
    }

    return null;
  }

  ldel(key: string, index: number): void {
    const list = this._get_list(key);
    list.splice(index, 1);
    this._drive.set(key, list);
  }

  lpush(key: string, value: JsonValue): void {
    const list = this._get_list(key);
    list.push(value);
    this._drive.set(key, list);
  }

  lpop(key: string): JsonValue | undefined {
    const list = this._get_list(key);
    return list.pop();
  }

  lsize(key: string): number {
    const list = this._get_list(key);
    return list.length;
  }

  lclear(key: string): void {
    this._drive.set(key, []);
  }

  lrange(key: string, start: number, stop: number): JsonValue[] {
    const list = this._get_list(key);
    return list.slice(start, stop);
  }

  private _load_ttl(): void {
    const ttlList = this.get(TTL_LIST_KEY);
    if (!Array.isArray(ttlList)) {
      // TTL list malformed, clear it
      this.del(TTL_LIST_KEY);
      return;
    }
    (ttlList as SerializedTTL[]).forEach(({ key, dat, ...rest }) => {
      // If the key does not exist, remove it from the TTL list
      if (!this.exists(key)) {
        this._ttl.delete(key);
        return;
      }

      // If the key has already expired, remove it from the TTL list
      if (!dat || dat < Date.now()) {
        this._ttl.delete(key);
        return;
      }

      this._ttl.set(key, {
        dat,
        ...rest
      });

      // Set the timeout for the key
      if (rest.type === 'key') {
        this._create_del_timout(key, dat);
      } else {
        this._create_ldel_timout(key, rest.index, dat);
      }
    });
  }

  private _create_del_timout(key: string, dat: number): void {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this._drive.del(key);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'key',
      dat
    });

    this._update_ttl_list();
  }

  private _create_ldel_timout(key: string, index: number, dat: number): void {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.lset(key, index, null);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'list',
      index,
      dat
    });
  }

  private _update_ttl_list(): void {
    const ttlList: SerializedTTL[] = [];
    this._ttl.forEach((ttl, key) => {
      ttlList.push({
        key,
        ...ttl
      });
    });
    this.set(TTL_LIST_KEY, ttlList);
  }

  /**
   * Delete a key after a certain time.
   *
   * @param key
   * @param value
   * @param seconds
   */
  setex(key: string, value: JsonValue, seconds: number) {
    this._drive.set(key, value);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    // setTimeout(() => {
    //   this._drive.del(key);
    //   this._ttl.delete(key);
    // }, secs);
    // this._set_ttl(key, delAt);
    this._create_del_timout(key, delAt);
  }

  /**
   * Set list item with expiration time. The item in the list will be deleted after the expiration time.
   *
   * @param key
   * @param index
   * @param value
   * @param seconds
   */
  lsetex(key: string, index: number, value: any, seconds: number) {
    const list = this._get_list(key);
    list[index] = value;
    this._drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    // setTimeout(() => {
    //   this.lset(key, index, undefined);
    //   this._ttl.delete(key);
    // }, seconds * 1000);
    // this._ttl.set(key, delAt);
    this._create_ldel_timout(key, index, delAt);
  }

  /**
   * Get the remaining time to live in seconds.
   *
   * @param key
   * @param milliseconds If true, returns the remaining time in milliseconds.
   * @return {number} -1 if the key does not exist or does not have a timeout.
   */
  ttl(key: string, milliseconds?: boolean): number {
    const item = this._ttl.get(key);
    if (!item) {
      return -1;
    }
    const now = Date.now();
    const ttl = item.dat - now;
    if (ttl < 0) {
      return -1;
    }
    if (milliseconds) {
      return ttl;
    }
    return Math.floor(ttl / 1000);
  }
}

// -----------

export type * from '@/typings.ts';

// -----------

export { JsonMap } from '@/parser';
