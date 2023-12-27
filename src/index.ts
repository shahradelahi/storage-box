import MemoryDrive from '@/driver/memory.ts';
import type { IStorageBox, IStorageDrive } from '@/typings.ts';
import type { JsonArray, JsonValue } from 'type-fest';

export class Client implements IStorageBox {
  private _drive: IStorageDrive;
  private _ttl: Map<string, number> = new Map();

  constructor(storage?: IStorageDrive) {
    this._drive = storage || new MemoryDrive();
  }

  get(key: string): JsonValue | undefined {
    return this._drive.get(key);
  }

  set(key: string, value: JsonValue): void {
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

    const list = this._drive.get(key);
    if (!Array.isArray(list)) {
      throw new Error('Key is not a list');
    }

    return list;
  }

  list(key: string): JsonArray {
    return this._get_list(key);
  }

  lset(key: string, index: number, value: any): void {
    const list = this._get_list(key);
    list[index] = value;
    this._drive.set(key, list);
  }

  lget(key: string, index: number): JsonValue | undefined {
    const list = this._get_list(key);
    return list[index];
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
    setTimeout(() => {
      this._drive.del(key);
      this._ttl.delete(key);
    }, secs);
    this._ttl.set(key, delAt);
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
    setTimeout(() => {
      this.lset(key, index, undefined);
      this._ttl.delete(key);
    }, seconds * 1000);
    this._ttl.set(key, delAt);
  }

  /**
   * Get the remaining time to live in seconds.
   *
   * @param key
   * @param milliseconds If true, returns the remaining time in milliseconds.
   * @return {number} -1 if the key does not exist or does not have a timeout.
   */
  ttl(key: string, milliseconds?: boolean): number {
    const delAt = this._ttl.get(key);
    if (!delAt) {
      return -1;
    }
    const now = Date.now();
    const ttl = delAt - now;
    if (ttl < 0) {
      return -1;
    }
    if (milliseconds) {
      return ttl;
    }
    return Math.floor(ttl / 1000);
  }
}

export * from '@/typings.ts';
