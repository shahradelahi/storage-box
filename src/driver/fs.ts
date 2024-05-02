import MemoryDriver from '@/driver/memory.ts';
import { JsonMap } from '@/index.ts';
import type { IStorageParser, Serializable } from '@/typings.ts';
import debounce, { type DebouncedFunction } from 'debounce';
import { resolve } from 'path';

export interface FsOptions {
  parser?: IStorageParser;
  debounceTime?: number;
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
  private readonly _parser: IStorageParser;
  private readonly _debounceTime: number;
  private readonly _bouncyWriteFn: DebouncedFunction<() => Promise<void>>;

  private readonly _fsMod = import('node:fs');

  constructor(path: string, opts: FsOptions = {}) {
    super();

    const { parser = JsonMap, debounceTime = 100 } = opts;

    this._path = resolve(path);
    this._parser = parser;
    this._debounceTime = debounceTime || 1;
    this._bouncyWriteFn = debounce(this._write, this._debounceTime);

    process.on('exit', async () => await this._bouncyWriteFn());
  }

  async prepare() {
    const { existsSync, readFileSync } = await this._fsMod;

    if (existsSync(this._path)) {
      const rawData = readFileSync(this._path, 'utf-8');
      const parser = this._parser;

      const _storage = rawData === '' ? new Map<string, Serializable>() : parser.parse(rawData);

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

    await promises.writeFile(this._path, data, 'utf-8');
  }

  async set(key: string, value: Serializable): Promise<void> {
    await super.set(key, value);
    this._bouncyWriteFn();
  }

  async del(key: string): Promise<void> {
    await super.del(key);
    this._bouncyWriteFn();
  }

  async clear(): Promise<void> {
    await super.clear();
    this._bouncyWriteFn();
  }
}
