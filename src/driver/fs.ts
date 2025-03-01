import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import debounce, { type DebouncedFunction } from 'debounce';
import exitHook from 'exit-hook';

import { JsonMap, MemoryDriver } from '@/index';
import type { IStorageParser, Serializable } from '@/typings';
import { FileWriter } from '@/utils/file-writer';
import { access } from '@/utils/fs-extra';

export interface FsOptions {
  parser?: IStorageParser;

  /**
   * The encoding to use when writing to the file.
   * @default UTF-8
   */
  encoding?: BufferEncoding;

  /**
   * @default 100
   */
  debounceTime?: number;
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
  private readonly _writer: FileWriter;
  private readonly _parser: IStorageParser;
  private readonly _debounceTime: number;
  private readonly _bouncyWriteFn: DebouncedFunction<() => void>;
  private readonly _encoding: BufferEncoding;

  constructor(path: string, opts: FsOptions = {}) {
    const { parser = JsonMap, debounceTime = 100 } = opts;
    super();

    this._path = resolve(path);
    this._parser = parser;
    this._debounceTime = debounceTime || 1;
    this._bouncyWriteFn = debounce(this.write, this._debounceTime);
    this._encoding = opts.encoding || 'utf-8';
    this._writer = new FileWriter(this._path, { encoding: this._encoding });

    exitHook(() => {
      this._bouncyWriteFn.clear();
      this.write();
    });

    // Try to create a recursive
    const fileDir = dirname(this._path);
    if (!access(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    if (access(this._path)) {
      const rawData = readFileSync(this._path, this._encoding);
      const parser = this._parser;

      const _storage = rawData === '' ? new Map<string, Serializable>() : parser.parse(rawData);

      _storage.forEach((val, key) => {
        this._storage[key] = val;
      });
    }
  }

  async write(): Promise<void> {
    const data = this._parser.stringify(this._storage);
    await this._writer.write(data);
  }

  override set(key: string, value: Serializable): void {
    super.set(key, value);
    this._bouncyWriteFn();
  }

  override del(key: string): void {
    super.del(key);
    this._bouncyWriteFn();
  }

  override clear(): void {
    super.clear();
    this._bouncyWriteFn();
  }
}
