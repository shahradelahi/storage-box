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
} from '@/typings';

class Client<Driver extends StorageDriver = MemoryDriver> implements StorageOperations {
  readonly #drive: StorageDriver;
  readonly #ttl: Map<HashField, TTL> = new Map();

  constructor(storage?: Driver) {
    this.#drive = storage || new MemoryDriver();
    this.#load_ttl();
  }

  getall(): HashRecord {
    const record: HashRecord = {};
    for (const key of this.#drive.keys()) {
      record[key] = this.get(key);
    }
    return record;
  }

  get<Value extends HashValue>(key: HashField): Value | null {
    const ttl = this.#ttl.get(key);

    // Return if ttl is not set or not expired
    if (!ttl || ttl.dat > Date.now()) {
      const val = this.#drive.get(key) as Value;
      return val ?? null;
    }

    if (ttl.type === 'key') {
      this.del(key);
    }

    if (ttl.type === 'list') {
      // Delete key from TTL list due to TTL mismatch
      this.#ttl.delete(key);
    }

    return null;
  }

  set(key: HashKey, value: Serializable | null) {
    this.#drive.set(key, value);
  }

  del(key: HashKey) {
    this.#drive.del(key);
  }

  exists(key: HashKey) {
    return this.#drive.exists(key);
  }

  has(key: HashKey) {
    return this.exists(key);
  }

  keys<Key extends HashKey = string>(): Key[] {
    return this.#drive.keys() as Key[];
  }

  values<Value extends HashValue>() {
    const vals: Value[] = [];
    for (const key of this.#drive.keys()) {
      vals.push(this.get(key) as Value);
    }
    return vals;
  }

  clear() {
    this.#drive.clear();
  }

  ////
  // Hash operations
  ////

  #get_hash(key: HashKey): HashRecord {
    if (!this.#drive.exists(key)) {
      this.#drive.set(key, {});
      return {};
    }

    const map = this.#drive.get(key) as HashRecord | null;
    if (!map) {
      return {};
    }

    if (typeof map !== 'object') {
      throw new Error('Accessed non-object value at key: ' + key);
    }

    return map;
  }

  hget(key: HashKey, field: HashField) {
    const map = this.#get_hash(key);
    return map[field] ?? null;
  }

  hset(key: HashKey, field: HashField, value: Serializable) {
    const map = this.#get_hash(key);
    map[field] = value;
    this.#drive.set(key, map);
  }

  hsetex(key: HashKey, field: HashField, value: Serializable, seconds: number) {
    const map = this.#get_hash(key);
    map[field] = value;
    this.#drive.set(key, map);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_hdel_timout(key, field, delAt);
  }

  hkeys(key: HashKey) {
    const map = this.#get_hash(key);
    return Object.keys(map);
  }

  hvalues(key: HashKey) {
    const map = this.#get_hash(key);
    return Object.values(map);
  }

  hdel(key: HashKey, field: HashField) {
    const map = this.#get_hash(key);
    delete map[field];
    this.#drive.set(key, map);
  }

  hexists(key: HashKey, field: HashField) {
    const map = this.#get_hash(key);
    return field in map;
  }

  hsize(key: HashKey) {
    const map = this.#get_hash(key);
    return Object.keys(map).length;
  }

  hclear(key: HashKey) {
    this.#drive.set(key, {});
  }

  hgetall<Key extends HashField, Value extends HashValue>(key: string): HashRecord<Key, Value> {
    const map = this.#get_hash(key);
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

  #get_list(key: HashField): SerializableList {
    if (!this.#drive.exists(key)) {
      this.#drive.set(key, []);
    }

    const list = this.#drive.get(key); // Not using this.get() to avoid TTL check
    if (!list) {
      return [];
    }

    if (!Array.isArray(list)) {
      throw new TypeError(`Expected list at key: ${key}`);
    }

    return list as SerializableList;
  }

  lgetall(key: HashKey) {
    return this.#get_list(key);
  }

  lset(key: HashField, index: number, value: Serializable | null) {
    const list = this.#get_list(key);
    list[index] = value;
    this.#drive.set(key, list);
  }

  lget(key: HashField, index: number): HashValue | null {
    const ttl = this.#ttl.get(key);

    if (!ttl || ttl.dat > Date.now()) {
      const list = this.#get_list(key);
      return list[index] as HashValue;
    }

    if (ttl.type === 'list') {
      this.lset(key, ttl.index, null);
    }

    if (ttl.type === 'key') {
      // TTL mismatch with the key, delete the key from the TTL list
      this.#ttl.delete(key);
    }

    return null;
  }

  ldel(key: HashKey, index: number) {
    const list = this.#get_list(key);
    list.splice(index, 1);
    this.#drive.set(key, list);
  }

  lpush(key: HashKey, value: Serializable): void {
    const list = this.#get_list(key);
    list.push(value);
    this.#drive.set(key, list);
  }

  lpushex(key: HashKey, value: Serializable, seconds: number): void {
    const list = this.#get_list(key);
    list.push(value);
    this.#drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_ldel_timout(key, list.length - 1, delAt);
  }

  lexists(key: HashKey, value: Serializable): boolean {
    const list = this.#get_list(key);
    return list.includes(value);
  }

  /**
   * Removes and returns the last element of the list stored at key.
   *
   * @param key - The key of the list.
   */
  lpop(key: HashKey): HashValue | null {
    const list = this.#get_list(key);
    return list.pop() ?? null;
  }

  lsize(key: HashKey) {
    const list = this.#get_list(key);
    return list.length;
  }

  lclear(key: HashKey) {
    this.#drive.set(key, []);
  }

  /**
   * Returns a slice of the list stored at key, starting at the specified index and ending at the specified index.
   *
   * @param key - The key of the list.
   * @param start - The index to start the slice at.
   * @param stop - The index to end the slice at.
   */
  lrange(key: HashKey, start: number, stop: number): HashValue[] {
    const list = this.#get_list(key);
    return list.slice(start, stop);
  }

  #load_ttl() {
    const ttlList = this.#drive.get(TTL_LIST_KEY) as SerializedTTL[] | undefined;
    if (!ttlList || !Array.isArray(ttlList)) {
      // TTL list malformed, clear it
      return this.#drive.del(TTL_LIST_KEY);
    }

    ttlList.map(({ key, dat, ...rest }) => {
      // If the key does not exist, remove it from the TTL list
      if (!this.#drive.exists(key)) {
        this.#ttl.delete(key);
        return;
      }

      // If the key has already expired, remove it from the TTL list
      if (!dat || dat < Date.now()) {
        this.#drive.del(key);
        this.#ttl.delete(key);
        return;
      }

      this.#ttl.set(key, {
        dat,
        ...rest,
      });

      // Set the timeout for the key
      switch (rest.type) {
        case 'key':
          this.#create_del_timout(key, dat);
          break;
        case 'list':
          this.#create_ldel_timout(key, rest.index, dat);
          break;
        case 'hash':
          this.#create_hdel_timout(key, rest.field, dat);
          break;
        default:
          throw new Error('TTL malformed at key: ' + key);
      }
    });
  }

  #create_del_timout(key: HashField, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.#drive.del(key);
      this.#ttl.delete(key);
    }, timeLeft);

    this.#ttl.set(key, {
      type: 'key',
      dat,
    });

    this.#update_ttl_list();
  }

  #create_ldel_timout(key: HashField, index: number, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.lset(key, index, null);
      this.#ttl.delete(key);
    }, timeLeft);

    this.#ttl.set(key, {
      type: 'list',
      index,
      dat,
    });

    this.#update_ttl_list();
  }

  #create_hdel_timout(key: HashField, field: HashField, dat: number) {
    const timeLeft = dat - Date.now();
    setTimeout(() => {
      this.hset(key, field, null);
      this.#ttl.delete(key);
    }, timeLeft);

    this.#ttl.set(key, {
      type: 'hash',
      field,
      dat,
    });

    this.#update_ttl_list();
  }

  #update_ttl_list() {
    const ttlList: SerializedTTL[] = [];
    this.#ttl.forEach((ttl, key) => {
      ttlList.push(Object.assign(ttl, { key }));
    });
    this.set(TTL_LIST_KEY, ttlList);
  }

  /**
   * Delete a key after a certain time.
   *
   * @param key
   * @param value
   * @param seconds
   */
  setex(key: HashKey, value: Serializable, seconds: number) {
    this.#drive.set(key, value);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_del_timout(key, delAt);
  }

  /**
   * Set list item with expiration time. The item in the list will be deleted after the expiration time.
   *
   * @param key
   * @param index
   * @param value
   * @param seconds
   */
  lsetex(key: HashKey, index: number, value: Serializable, seconds: number) {
    const list = this.#get_list(key);
    list[index] = value;
    this.#drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_ldel_timout(key, index, delAt);
  }

  /**
   * Get the remaining time to live in seconds.
   *
   * Returns -1 if the key does not exist or does not have a timeout.
   *
   * @param key
   * @param milliseconds If true, returns the remaining time in milliseconds.
   */
  ttl(key: HashKey, milliseconds?: boolean) {
    const item = this.#ttl.get(key);
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
