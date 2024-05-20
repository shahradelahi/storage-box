import { PathLike, promises } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import debounce, { type DebouncedFunction } from 'debounce';

import { JsonMap, MemoryDriver } from '@/index';
import type { IStorageParser, Serializable } from '@/typings';
import { access } from '@/utils/fs-extra';

export interface FsOptions {
  parser?: IStorageParser;
  /** Encoding for the file. */
  encoding?: BufferEncoding;
  debounceTime?: number;
}

// Returns a temporary file
// Example: for /some/file will return /some/.file.tmp
function getTempFilename(file: PathLike): string {
  const f = file instanceof URL ? fileURLToPath(file) : file.toString();
  return join(dirname(f), `.${basename(f)}.tmp`);
}

export default class FsDriver extends MemoryDriver {
  private readonly _path: string;
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
  }

  async prepare() {
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
    const tmp = getTempFilename(this._path);
    await promises.writeFile(tmp, data, this._encoding);
    await promises.rename(tmp, this._path);
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
