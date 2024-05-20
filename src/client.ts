import { TTL_LIST_KEY } from '@/constants';
import MemoryDriver from '@/driver/memory';
import { HashMap } from '@/hash-map';
import { HashKey, HashValue } from '@/index';
import { List } from '@/list';
import type { SerializedTTL, TTL } from '@/ttl';
import type {
  Class,
  HashField,
  HashRecord,
  Serializable,
  SerializableList,
  StorageDriver,
  StorageOperations,
  StorageState,
} from '@/typings';

class Client<Driver extends StorageDriver = MemoryDriver> implements StorageOperations {
  private readonly _drive: StorageDriver;

  private readonly _ttl: Map<HashField, TTL> = new Map();
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

  async getall(): Promise<HashRecord> {
    await this._preparedDriver();
    const record: HashRecord = {};
    for (const key of await this._drive.keys()) {
      record[key] = await this.get(key);
    }
    return record;
  }

  async get<Value extends HashValue>(key: HashField): Promise<Value | null> {
    await this._preparedDriver();

    const ttl = this._ttl.get(key);

    // Return if ttl is not set or not expired
    if (!ttl || ttl.dat > Date.now()) {
      return ((await this._drive.get(key)) as Value) ?? null;
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

  async set(key: HashKey, value: Serializable | null) {
    await this._preparedDriver();
    await this._drive.set(key, value);
  }

  async del(key: HashKey) {
    await this._preparedDriver();
    await this._drive.del(key);
  }

  async exists(key: HashKey) {
    await this._preparedDriver();
    return this._drive.exists(key);
  }

  async has(key: HashKey) {
    return this.exists(key);
  }

  async keys<Key extends HashKey = string>(): Promise<Key[]> {
    await this._preparedDriver();
    return (await this._drive.keys()) as Key[];
  }

  async values<Value extends HashValue>() {
    await this._preparedDriver();
    const vals: Value[] = [];
    for (const key of await this._drive.keys()) {
      vals.push((await this.get(key)) as Value);
    }
    return vals;
  }

  async clear() {
    await this._preparedDriver();
    await this._drive.clear();
  }

  ////
  // Hash operations
  ////

  private async _get_hash(key: HashKey) {
    if (!(await this._drive.exists(key))) {
      await this._drive.set(key, {});
      return {};
    }

    const map = (await this._drive.get(key)) as Record<HashField, Serializable>;
    if (!map) {
      return {};
    }

    if (typeof map !== 'object') {
      throw new Error('Accessed non-object value at key: ' + key);
    }

    return map;
  }

  async hget(key: HashKey, field: HashField) {
    await this._preparedDriver();

    const map = await this._get_hash(key);
    return map[field] ?? null;
  }

  async hset(key: HashKey, field: HashField, value: Serializable) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    map[field] = value;
    await this._drive.set(key, map);
  }

  async hsetex(key: HashKey, field: HashField, value: Serializable, seconds: number) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    map[field] = value;
    await this._drive.set(key, map);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    await this._create_hdel_timout(key, field, delAt);
  }

  async hkeys(key: HashKey) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    return Object.keys(map);
  }

  async hvalues(key: HashKey) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    return Object.values(map);
  }

  async hdel(key: HashKey, field: HashField) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    delete map[field];
    await this._drive.set(key, map);
  }

  async hexists(key: HashKey, field: HashField) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    return field in map;
  }

  async hsize(key: HashKey) {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    return Object.keys(map).length;
  }

  async hclear(key: HashKey) {
    await this._preparedDriver();
    await this._drive.set(key, {});
  }

  async hgetall<Key extends HashField, Value extends HashValue>(
    key: string
  ): Promise<HashRecord<Key, Value>> {
    await this._preparedDriver();
    const map = await this._get_hash(key);
    return map as HashRecord<Key, Value>;
  }

  #createInstance<Instance>(key: string | undefined, abstract: Class<Instance>): Instance {
    if (typeof key !== 'string') {
      const random = Buffer.from(Math.random().toString(36).slice(2)).toString('hex');
      key = `[${abstract.name}-${random}]`;
    }

    return new abstract(this, key);
  }

  createHashMap<
    Key extends HashField,
    Value extends HashValue,
    Map extends HashMap<Key, Value> = HashMap<Key, Value>,
  >(key?: string | Class<Map>, abstract?: Class<Map>): Map {
    return this.#createInstance(
      typeof key !== 'string' ? undefined : key,
      typeof key !== 'string' ? key ?? HashMap : (abstract as any) ?? HashMap
    );
  }

  createList<Value extends HashValue, _List extends List<Value>>(
    key?: string | Class<_List>,
    abstract?: Class<_List>
  ): _List {
    return this.#createInstance(
      typeof key !== 'string' ? undefined : key,
      typeof key !== 'string' ? key ?? List : (abstract as any) ?? List
    );
  }

  ////
  // List operations
  ////

  private async _get_list(key: HashField): Promise<SerializableList> {
    if (!(await this._drive.exists(key))) {
      await this._drive.set(key, []);
    }

    const list = await this._drive.get(key); // Not using this.get() to avoid TTL check
    if (!list) {
      return [];
    }

    if (!Array.isArray(list)) {
      throw new TypeError(`Expected list at key: ${key}`);
    }

    return list as SerializableList;
  }

  async lgetall(key: HashKey) {
    return this._get_list(key);
  }

  async lset(key: HashField, index: number, value: Serializable | null) {
    const list = await this._get_list(key);
    list[index] = value;
    await this._drive.set(key, list);
  }

  async lget(key: HashField, index: number): Promise<HashValue | null> {
    const ttl = this._ttl.get(key);

    if (!ttl || ttl.dat > Date.now()) {
      const list = await this._get_list(key);
      return list[index] as HashValue;
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

  async ldel(key: HashKey, index: number) {
    const list = await this._get_list(key);
    list.splice(index, 1);
    await this._drive.set(key, list);
  }

  async lpush(key: HashKey, value: Serializable): Promise<void> {
    const list = await this._get_list(key);
    list.push(value);
    await this._drive.set(key, list);
  }

  /**
   * Removes and returns the last element of the list stored at key.
   *
   * @param key - The key of the list.
   */
  async lpop(key: HashKey): Promise<HashValue | null> {
    const list = await this._get_list(key);
    return list.pop() ?? null;
  }

  async lsize(key: HashKey) {
    const list = await this._get_list(key);
    return list.length;
  }

  async lclear(key: HashKey) {
    await this._drive.set(key, []);
  }

  /**
   * Returns a slice of the list stored at key, starting at the specified index and ending at the specified index.
   *
   * @param key - The key of the list.
   * @param start - The index to start the slice at.
   * @param stop - The index to end the slice at.
   */
  async lrange(key: HashKey, start: number, stop: number): Promise<HashValue[]> {
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
          this._ttl.delete(key);
          return;
        }

        // If the key has already expired, remove it from the TTL list
        if (!dat || dat < Date.now()) {
          await this._drive.del(key);
          this._ttl.delete(key);
          return;
        }

        this._ttl.set(key, {
          dat,
          ...rest,
        });

        // Set the timeout for the key
        switch (rest.type) {
          case 'key':
            await this._create_del_timout(key, dat);
            break;
          case 'list':
            await this._create_ldel_timout(key, rest.index, dat);
            break;
          case 'hash':
            await this._create_hdel_timout(key, rest.field, dat);
            break;
          default:
            throw new Error('TTL malformed at key: ' + key);
        }
      })
    );
  }

  private async _create_del_timout(key: HashField, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this._drive.del(key);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'key',
      dat,
    });

    await this._update_ttl_list();
  }

  private async _create_ldel_timout(key: HashField, index: number, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.lset(key, index, null);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'list',
      index,
      dat,
    });

    await this._update_ttl_list();
  }

  private async _create_hdel_timout(key: HashField, field: HashField, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.hset(key, field, null);
      this._ttl.delete(key);
    }, timeLeft);

    this._ttl.set(key, {
      type: 'hash',
      field,
      dat,
    });

    await this._update_ttl_list();
  }

  private async _update_ttl_list() {
    const ttlList: SerializedTTL[] = [];
    this._ttl.forEach((ttl, key) => {
      ttlList.push(Object.assign(ttl, { key }));
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
  async setex(key: HashKey, value: Serializable, seconds: number) {
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
  async lsetex(key: HashKey, index: number, value: Serializable, seconds: number) {
    const list = await this._get_list(key);
    list[index] = value;
    await this._drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
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
  async ttl(key: HashKey, milliseconds?: boolean) {
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
