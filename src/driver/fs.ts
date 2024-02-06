import MemoryDriver from '@/driver/memory.ts';
import { JsonMap } from '@/parser';
import type { IStorageParser } from '@/typings.ts';
import debounce from 'debounce';
import { existsSync, promises, readFileSync } from 'fs';
import { resolve } from 'path';
import type { JsonValue } from 'type-fest';

export interface FsOptions {
  parser?: IStorageParser;
  debounceTime?: number;
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
  private readonly _parser: IStorageParser;
  private readonly _debounceTime: number;
  private readonly _bouncyWriteFn: () => void;

  constructor(path: string, { parser, debounceTime }: FsOptions = {}) {
    const solvedPath = resolve(path);
    const _parser = parser || JsonMap;

    if (existsSync(solvedPath)) {
      const data = readFileSync(solvedPath, 'utf-8');
      const storage = _parser.parse(data === '' ? '{}' : data);
      super(storage);
    } else {
      super();
    }

    this._path = solvedPath;
    this._parser = _parser;
    this._debounceTime = debounceTime || 1;
    this._bouncyWriteFn = debounce(() => {
      this._write();
    }, this._debounceTime);
  }

  [Symbol.dispose](): void {
    this._bouncyWriteFn();
  }

  private _write(): void {
    const data = this._parser.stringify(this._storage);
    // Write file on promise to avoid blocking the event loop
    promises.writeFile(this._path, data, 'utf-8');
  }

  set(key: string, value: JsonValue): void {
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
