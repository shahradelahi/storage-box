import { promises } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import debounce, { type DebouncedFunction } from 'debounce';

import { JsonMap, MemoryDriver } from '@/index';
import type { IStorageParser, Serializable } from '@/typings';
import { FileWriter } from '@/utils/file-writer';
import { access } from '@/utils/fs-extra';

export interface FsOptions {
  parser?: IStorageParser;
  /** Encoding for the file. (default `utf-8`) */
  encoding?: BufferEncoding;
  debounceTime?: number;
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
  private readonly _writer: FileWriter;
  private readonly _parser: IStorageParser;
  private readonly _debounceTime: number;
  private readonly _bouncyWriteFn: DebouncedFunction<() => Promise<void>>;
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
  }

  async prepare() {
    // Try to create a recursive
    const fileDir = dirname(this._path);
    if (!(await access(fileDir))) {
      await promises.mkdir(fileDir, { recursive: true });
    }

    if (await access(this._path)) {
      const rawData = await promises.readFile(this._path, this._encoding);
      const parser = this._parser;

      const _storage = rawData === '' ? new Map<string, Serializable>() : parser.parse(rawData);

      _storage.forEach((val, key) => {
        // If the data was in the memory it means it was changed before load time.
        // do NOT load the that are changed
        if (!(key in this._storage)) {
          this._storage[key] = val;
        }
      });
    }

    process.on('beforeExit', async () => {
      this._bouncyWriteFn.flush();
    });
  }

  async write(): Promise<void> {
    const data = this._parser.stringify(this._storage);
    await this._writer.write(data);
  }

  override async set(key: string, value: Serializable): Promise<void> {
    await super.set(key, value);
    this._bouncyWriteFn();
  }

  override async del(key: string): Promise<void> {
    await super.del(key);
    this._bouncyWriteFn();
  }

  override async clear(): Promise<void> {
    await super.clear();
    this._bouncyWriteFn();
  }
}
