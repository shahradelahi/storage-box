import type { JsonArray, JsonValue } from 'type-fest';
import type { IStorageBox, IStorageDrive } from '@/typings.ts';
import MemoryDrive from '@/drives/memory.ts';

export class Client implements IStorageBox {
  private _drive: IStorageDrive;

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
}

export default Client;
