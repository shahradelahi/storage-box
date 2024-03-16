import MemoryDriver from '@/driver/memory.ts';
import type { IStorageParser, Serializable } from '@/typings.ts';
import { JsonMap } from '@/index.ts';
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

  public state: 'pending' | 'ready' = 'pending';

  constructor(path: string, opts: FsOptions = {}) {
    const { parser, debounceTime } = opts;

    const _path = resolve(path);
    const _parser = parser || JsonMap;
    super();

    this._path = _path;
    this._parser = _parser;
    this._debounceTime = debounceTime || 1;
    this._bouncyWriteFn = debounce(() => {
      this._write().catch();
    }, this._debounceTime);

    (async () => {
      const { existsSync, readFileSync } = await this._fsMod;

      if (existsSync(_path)) {
        const data = readFileSync(_path, 'utf-8');
        this._storage = _parser.parse(data === '' ? '{}' : data);
      }

      this.state = 'ready';
    })();
  }

  [Symbol.dispose](): void {
    this._bouncyWriteFn();
  }

  private async _write(): Promise<void> {
    // Check if the storage is ready before writing
    if (this.state !== 'ready') {
      // bounce again
      return this._bouncyWriteFn();
    }

    const { promises } = await this._fsMod;

    const data = this._parser.stringify(this._storage);

    // Write file on promise to avoid blocking the event loop
    promises.writeFile(this._path, data, 'utf-8').catch();
  }

  set(key: string, value: Serializable): void {
    super.set(key, value);
    this._bouncyWriteFn();
  }

  del(key: string): void {
    super.del(key);
    this._bouncyWriteFn();
  }

  clear(): void {
    super.clear();
    this._bouncyWriteFn();
  }
}
