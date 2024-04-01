import MemoryDriver from '@/driver/memory.ts';
import { JsonMap, MSGPack } from '@/index.ts';
import type { IStorageParser, Serializable } from '@/typings.ts';
import debounce from 'debounce';
import { resolve } from 'path';

export interface FsOptions {
  parser?: IStorageParser;
  debounceTime?: number;
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
  private readonly _parser: IStorageParser;
  private readonly _debounceTime: number;
  private readonly _bouncyWriteFn: () => void;

  private readonly _fsMod = import('node:fs');

  constructor(path: string, opts: FsOptions = {}) {
    const { parser, debounceTime = 10 } = opts;

    const _path = resolve(path);
    const _parser = parser || JsonMap;
    super();

    this._path = _path;
    this._parser = _parser;
    this._debounceTime = debounceTime || 1;
    this._bouncyWriteFn = debounce(() => {
      this._write().catch();
    }, this._debounceTime);
  }

  async prepare() {
    const { existsSync, readFileSync } = await this._fsMod;

    if (existsSync(this._path)) {
      const rawData = readFileSync(this._path, 'utf-8');
      const parser = this._parser;

      const _storage =
        parser instanceof MSGPack
          ? MSGPack.parse(rawData === '' ? 'gA==' : rawData)
          : parser instanceof JsonMap
            ? JsonMap.parse(rawData === '' ? '{}' : rawData)
            : new Map<string, Serializable>();

      _storage.forEach((val, key) => {
        // If the data was in the memory it means it was changed before load time.
        // do NOT load the that are changed
        if (!this._storage.has(key)) {
          this._storage.set(key, val);
        }
      });
    }
  }

  [Symbol.dispose](): void {
    this._bouncyWriteFn();
  }

  private async _write(): Promise<void> {
    const { promises } = await this._fsMod;

    const data = this._parser.stringify(this._storage);

    // Write file on promise to avoid blocking the event loop
    promises.writeFile(this._path, data, 'utf-8').catch();
  }

  async set(key: string, value: Serializable): Promise<void> {
    await super.set(key, value);
    this._bouncyWriteFn();
  }

  async del(key: string): Promise<void> {
    super.del(key);
    this._bouncyWriteFn();
  }

  async clear(): Promise<void> {
    await super.clear();
    this._bouncyWriteFn();
  }
}
