import { TTL_LIST_KEY } from '@/constants.ts';
import { MemoryDriver, StorageState } from '@/index.ts';
import type { SerializedTTL, TTL } from '@/ttl.ts';
import type { IOperations, IStorageDrive, Serializable, SerializableList } from '@/typings.ts';

class Client<Driver extends IStorageDrive = MemoryDriver> implements IOperations<Driver> {
  private _drive: IStorageDrive;

  private _ttl: Map<string, TTL> = new Map();
  private _state: StorageState = 'pending';

  constructor(storage?: Driver) {
    this._drive = storage || new MemoryDriver();
    this._prepare().finally();
  }

  private async _prepare() {
    if (this._drive.prepare) {
      await this._drive.prepare();
    }

    await this._load_ttl();
    this._state = 'ready';
  }

  private async _preparedDriver() {
    if (this._state === 'ready') {
      return;
    }

    // Wait til driver is ready
    return new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        if (this._state === 'ready') {
          clearInterval(intervalId);
          resolve();
        }
      }, 1);
    });
  }

  async get(key: string): Promise<Serializable> {
    await this._preparedDriver();

    const ttl = this._ttl.get(key);

    // Return if ttl is not set or not expired
    if (!ttl || ttl.dat > Date.now()) {
      return (await this._drive.get(key)) ?? null;
    }

    if (ttl.type === 'key') {
      await this.del(key);
    }

    if (ttl.type === 'list') {
      // Delete key from TTL list due to TTL mismatch
      this._ttl.delete(key);
    }

    return null;
  }

  async set(key: string, value: Serializable | null) {
    await this._preparedDriver();
    await this._drive.set(key, value);
  }

  async del(key: string) {
    await this._preparedDriver();
    await this._drive.del(key);
  }

  async exists(key: string) {
    await this._preparedDriver();
    return this._drive.exists(key);
  }

  async has(key: string) {
    await this._preparedDriver();
    return this._drive.exists(key);
  }

  async keys() {
    await this._preparedDriver();
    return this._drive.keys();
  }

  async clear() {
    await this._preparedDriver();
    await this._drive.clear();
  }

  private async _get_list(key: string) {
    if (!(await this._drive.exists(key))) {
      await this._drive.set(key, []);
    }

    const list = await this._drive.get(key); // Not using this.get() to avoid TTL check
    if (!list) {
      return [];
    }

    if (!Array.isArray(list)) {
      throw new Error('Key is not a list or data is corrupted.');
    }

    return list as SerializableList;
  }

  async list(key: string) {
    return this._get_list(key);
  }

  async lset(key: string, index: number, value: Serializable | null) {
    const list = await this._get_list(key);
    list[index] = value;
    await this._drive.set(key, list);
  }

  async lget(key: string, index: number) {
    const ttl = this._ttl.get(key);

    if (!ttl || ttl.dat > Date.now()) {
      const list = await this._get_list(key);
      return list[index];
    }

    if (ttl.type === 'list') {
      await this.lset(key, ttl.index, null);
    }

    if (ttl.type === 'key') {
      // TTL mismatch with the key, delete the key from the TTL list
      this._ttl.delete(key);
    }

    return null;
  }

  async ldel(key: string, index: number) {
    const list = await this._get_list(key);
    list.splice(index, 1);
    await this._drive.set(key, list);
  }

  async lpush(key: string, value: Serializable): Promise<void> {
    const list = await this._get_list(key);
    list.push(value);
    await this._drive.set(key, list);
  }

  /**
   * Removes and returns the last element of the list stored at key.
   *
   * @param key - The key of the list.
   */
  async lpop(key: string) {
    const list = await this._get_list(key);
    return list.pop();
  }

  async lsize(key: string) {
    const list = await this._get_list(key);
    return list.length;
  }

  async lclear(key: string) {
    await this._drive.set(key, []);
  }

  /**
   * Returns a slice of the list stored at key, starting at the specified index and ending at the specified index.
   *
   * @param key - The key of the list.
   * @param start - The index to start the slice at.
   * @param stop - The index to end the slice at.
   */
  async lrange(key: string, start: number, stop: number) {
    const list = await this._get_list(key);
    return list.slice(start, stop);
  }

  private async _load_ttl() {
    const ttlList = (await this._drive.get(TTL_LIST_KEY)) as SerializedTTL[] | undefined;
    if (!ttlList || !Array.isArray(ttlList)) {
      // TTL list malformed, clear it
      return this._drive.del(TTL_LIST_KEY);
    }

    await Promise.all(
      ttlList.map(async ({ key, dat, ...rest }) => {
        // If the key does not exist, remove it from the TTL list
        if (!(await this._drive.exists(key))) {
          return this._ttl.delete(key);
        }

        // If the key has already expired, remove it from the TTL list
        if (!dat || dat < Date.now()) {
          await this._drive.del(key);
          return this._ttl.delete(key);
        }

        this._ttl.set(key, {
          dat,
          ...rest
        });

        // Set the timeout for the key
        if (rest.type === 'key') {
          await this._create_del_timout(key, dat);
        } else {
          await this._create_ldel_timout(key, rest.index, dat);
        }
      })
    );
  }

  private async _create_del_timout(key: string, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this._drive.del(key);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'key',
      dat
    });

    await this._update_ttl_list();
  }

  private async _create_ldel_timout(key: string, index: number, dat: number) {
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

    await this._update_ttl_list();
  }

  private async _update_ttl_list() {
    const ttlList: SerializedTTL[] = [];
    this._ttl.forEach((ttl, key) => {
      ttlList.push({
        key,
        ...ttl
      });
    });
    await this.set(TTL_LIST_KEY, ttlList);
  }

  /**
   * Delete a key after a certain time.
   *
   * @param key
   * @param value
   * @param seconds
   */
  async setex(key: string, value: Serializable, seconds: number) {
    await this._drive.set(key, value);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    // setTimeout(() => {
    //   this._drive.del(key);
    //   this._ttl.delete(key);
    // }, secs);
    // this._set_ttl(key, delAt);
    await this._create_del_timout(key, delAt);
  }

  /**
   * Set list item with expiration time. The item in the list will be deleted after the expiration time.
   *
   * @param key
   * @param index
   * @param value
   * @param seconds
   */
  async lsetex(key: string, index: number, value: Serializable, seconds: number) {
    const list = await this._get_list(key);
    list[index] = value;
    await this._drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    // setTimeout(() => {
    //   this.lset(key, index, undefined);
    //   this._ttl.delete(key);
    // }, seconds * 1000);
    // this._ttl.set(key, delAt);
    await this._create_ldel_timout(key, index, delAt);
  }

  /**
   * Get the remaining time to live in seconds.
   *
   * Returns -1 if the key does not exist or does not have a timeout.
   *
   * @param key
   * @param milliseconds If true, returns the remaining time in milliseconds.
   */
  async ttl(key: string, milliseconds?: boolean) {
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

export { Client };
