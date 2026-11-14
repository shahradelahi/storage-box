import { TTL_LIST_KEY } from '@/constants';
import MemoryDriver from '@/driver/memory';
import { HashMap } from '@/hash-map';
import { HashKey, HashValue } from '@/index';
import { List } from '@/list';
import type { SerializedTTL } from '@/ttl';
import type {
  Class,
  HashField,
  HashRecord,
  Serializable,
  SerializableList,
  StorageDriver,
  StorageOperations,
} from '@/typings';
import { defineOwn, hasOwn } from '@/utils/object';

interface KeyTTLEntry {
  type: 'key';
  rawKey: HashField;
  dat: number;
  timer: ReturnType<typeof setTimeout>;
}

interface ListTTLEntry {
  type: 'list';
  rawKey: HashField;
  index: number;
  dat: number;
  timer: ReturnType<typeof setTimeout>;
}

interface HashTTLEntry {
  type: 'hash';
  rawKey: HashField;
  rawField: HashField;
  dat: number;
  timer: ReturnType<typeof setTimeout>;
}

class Client<Driver extends StorageDriver = MemoryDriver> implements StorageOperations {
  readonly #drive: StorageDriver;
  readonly #keyTTLs = new Map<string, KeyTTLEntry>();
  readonly #listTTLs = new Map<string, Set<ListTTLEntry>>();
  readonly #hashTTLs = new Map<string, Map<string, HashTTLEntry>>();

  constructor(storage?: Driver) {
    this.#drive = storage || new MemoryDriver();
    this.#load_ttl();
  }

  #normalizeKey(key: HashField): string {
    return String(key);
  }

  #isReservedKey(key: HashField): boolean {
    return key === TTL_LIST_KEY;
  }

  #scheduleTimer(dat: number, fn: () => void): ReturnType<typeof setTimeout> {
    const timeLeft = Math.max(0, dat - Date.now());
    const timer = setTimeout(fn, timeLeft);
    if (
      typeof timer === 'object' &&
      timer !== null &&
      'unref' in timer &&
      typeof timer.unref === 'function'
    ) {
      timer.unref();
    }
    return timer;
  }

  getall(): HashRecord {
    const record: HashRecord = {};
    for (const key of this.keys()) {
      defineOwn(record, key, this.get(key));
    }
    return record;
  }

  get<Value extends HashValue>(key: HashField): Value | null {
    if (this.#isReservedKey(key)) {
      return null;
    }

    this.#expireDueForKey(key);

    if (!this.#drive.exists(key)) {
      return null;
    }

    const val = this.#drive.get(key) as Value;
    return val ?? null;
  }

  set(key: HashKey, value: Serializable | null) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#cancelAllTTLsForKey(key);
    this.#drive.set(key, value);
  }

  del(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#cancelAllTTLsForKey(key);
    this.#drive.del(key);
  }

  exists(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return false;
    }

    this.#expireDueForKey(key);
    return this.#drive.exists(key);
  }

  has(key: HashKey) {
    return this.exists(key);
  }

  keys<Key extends HashKey = string>(): Key[] {
    this.#expireAllDue();
    return this.#drive.keys().filter((key) => key !== TTL_LIST_KEY) as Key[];
  }

  values<Value extends HashValue>() {
    const vals: Value[] = [];
    for (const key of this.keys()) {
      vals.push(this.get(key) as Value);
    }
    return vals;
  }

  clear() {
    this.#clearAllTTLs();
    this.#drive.clear();
  }

  ////
  // Hash operations
  ////

  #get_hash(key: HashKey, create = false): HashRecord {
    if (!this.#drive.exists(key)) {
      const empty: HashRecord = {};
      if (create) {
        this.#drive.set(key, empty);
      }
      return empty;
    }

    const map = this.#drive.get(key) as HashRecord | null;
    if (!map) {
      const empty: HashRecord = {};
      if (create) {
        this.#drive.set(key, empty);
      }
      return empty;
    }

    if (typeof map !== 'object' || Array.isArray(map)) {
      throw new Error('Accessed non-object value at key: ' + key);
    }

    return map;
  }

  hget(key: HashKey, field: HashField) {
    if (this.#isReservedKey(key)) {
      return null;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    return hasOwn(map, field) ? (map[field] ?? null) : null;
  }

  hset(key: HashKey, field: HashField, value: Serializable) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key, true);
    defineOwn(map, field, value);
    this.#drive.set(key, map);

    if (this.#cancelHashTTLForField(key, field)) {
      this.#update_ttl_list();
    }
  }

  hsetex(key: HashKey, field: HashField, value: Serializable, seconds: number) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key, true);
    defineOwn(map, field, value);
    this.#drive.set(key, map);
    this.#cancelHashTTLForField(key, field);

    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_hdel_timout(key, field, delAt);
  }

  hkeys(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return [];
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    return Object.keys(map);
  }

  hvalues(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return [];
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    return Object.values(map);
  }

  hdel(key: HashKey, field: HashField) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const cancelled = this.#cancelHashTTLForField(key, field);

    if (this.#drive.exists(key)) {
      const map = this.#get_hash(key);
      if (hasOwn(map, field)) {
        delete map[field];
        this.#drive.set(key, map);
      }
    }

    if (cancelled) {
      this.#update_ttl_list();
    }
  }

  hexists(key: HashKey, field: HashField) {
    if (this.#isReservedKey(key)) {
      return false;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    return hasOwn(map, field);
  }

  hsize(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return 0;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    return Object.keys(map).length;
  }

  hclear(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return;
    }

    const cancelled = this.#cancelHashTTLsForKey(key);
    this.#drive.set(key, {});
    if (cancelled) {
      this.#update_ttl_list();
    }
  }

  hgetall<Key extends HashField, Value extends HashValue>(key: string): HashRecord<Key, Value> {
    if (this.#isReservedKey(key)) {
      return {} as HashRecord<Key, Value>;
    }

    this.#expireDueForKey(key);
    const map = this.#get_hash(key);
    const record = {} as HashRecord<Key, Value>;
    for (const [field, value] of Object.entries(map)) {
      defineOwn(record, field, value);
    }
    return record;
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
      typeof key !== 'string' ? (key ?? HashMap) : ((abstract as any) ?? HashMap)
    );
  }

  createList<Value extends HashValue, _List extends List<Value>>(
    key?: string | Class<_List>,
    abstract?: Class<_List>
  ): _List {
    return this.#createInstance(
      typeof key !== 'string' ? undefined : key,
      typeof key !== 'string' ? (key ?? List) : ((abstract as any) ?? List)
    );
  }

  ////
  // List operations
  ////

  #get_list(key: HashField, create = false): SerializableList {
    if (!this.#drive.exists(key)) {
      const empty: SerializableList = [];
      if (create) {
        this.#drive.set(key, empty);
      }
      return empty;
    }

    const list = this.#drive.get(key); // Not using this.get() to avoid TTL check
    if (!list) {
      const empty: SerializableList = [];
      if (create) {
        this.#drive.set(key, empty);
      }
      return empty;
    }

    if (!Array.isArray(list)) {
      throw new TypeError(`Expected list at key: ${key}`);
    }

    return list as SerializableList;
  }

  lgetall(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return [];
    }

    this.#expireDueForKey(key);
    return [...this.#get_list(key)];
  }

  lset(key: HashField, index: number, value: Serializable | null) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key, true);
    list[index] = value;
    this.#drive.set(key, list);

    if (this.#cancelListTTLAtIndex(key, index)) {
      this.#update_ttl_list();
    }
  }

  lget(key: HashField, index: number): HashValue | null {
    if (this.#isReservedKey(key)) {
      return null;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key);
    return (list[index] as HashValue) ?? null;
  }

  ldel(key: HashKey, index: number) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    if (!this.#drive.exists(key)) {
      return;
    }

    const list = this.#get_list(key);
    const len = list.length;
    if (len === 0) {
      return;
    }

    const normalized = Number.isNaN(index) ? 0 : Math.trunc(index);
    const actualStart = normalized < 0 ? Math.max(len + normalized, 0) : normalized;
    if (actualStart < len) {
      list.splice(actualStart, 1);
      this.#drive.set(key, list);
      this.#shiftListTTLsAfterDelete(key, actualStart);
    }
  }

  lpush(key: HashKey, value: Serializable): void {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key, true);
    list.push(value);
    this.#drive.set(key, list);
  }

  lpushex(key: HashKey, value: Serializable, seconds: number): void {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key, true);
    list.push(value);
    this.#drive.set(key, list);
    const secs = seconds * 1000;
    const delAt = Date.now() + secs;
    this.#create_ldel_timout(key, list.length - 1, delAt);
  }

  lexists(key: HashKey, value: Serializable): boolean {
    if (this.#isReservedKey(key)) {
      return false;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key);
    return list.includes(value);
  }

  /**
   * Removes and returns the last element of the list stored at key.
   *
   * @param key - The key of the list.
   */
  lpop(key: HashKey): HashValue | null {
    if (this.#isReservedKey(key)) {
      return null;
    }

    this.#expireDueForKey(key);
    if (!this.#drive.exists(key)) {
      return null;
    }

    const list = this.#get_list(key);
    if (list.length === 0) {
      return null;
    }

    const poppedIndex = list.length - 1;
    const value = list.pop() ?? null;
    this.#drive.set(key, list);

    if (this.#cancelListTTLAtIndex(key, poppedIndex)) {
      this.#update_ttl_list();
    }

    return value;
  }

  lsize(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return 0;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key);
    return list.length;
  }

  lclear(key: HashKey) {
    if (this.#isReservedKey(key)) {
      return;
    }

    const cancelled = this.#cancelListTTLsForKey(key);
    this.#drive.set(key, []);
    if (cancelled) {
      this.#update_ttl_list();
    }
  }

  /**
   * Returns a slice of the list stored at key, starting at the specified index and ending at the specified index.
   *
   * @param key - The key of the list.
   * @param start - The index to start the slice at.
   * @param stop - The index to end the slice at.
   */
  lrange(key: HashKey, start: number, stop: number): HashValue[] {
    if (this.#isReservedKey(key)) {
      return [];
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key);
    return list.slice(start, stop);
  }

  ////
  // TTL management
  ////

  #load_ttl() {
    const ttlList = this.#drive.get(TTL_LIST_KEY) as SerializedTTL[] | undefined;
    if (!ttlList || !Array.isArray(ttlList)) {
      // TTL list malformed, clear it
      if (this.#drive.exists(TTL_LIST_KEY)) {
        this.#drive.del(TTL_LIST_KEY);
      }
      return;
    }

    const now = Date.now();
    let needsPersistUpdate = false;

    for (const item of ttlList) {
      if (!item || typeof item !== 'object') {
        needsPersistUpdate = true;
        continue;
      }

      const { key, dat, ...rest } = item;

      // If the key does not exist, remove it from the TTL list
      if (
        key === undefined ||
        key === null ||
        this.#isReservedKey(key) ||
        !this.#drive.exists(key)
      ) {
        needsPersistUpdate = true;
        continue;
      }

      // If the target has already expired, expire only that key/element/field
      if (!dat || typeof dat !== 'number' || dat <= now) {
        needsPersistUpdate = true;
        switch (rest.type) {
          case 'key':
            this.#drive.del(key);
            break;
          case 'list': {
            const raw = this.#drive.get(key);
            if (Array.isArray(raw) && rest.index >= 0 && rest.index < raw.length) {
              raw[rest.index] = null;
              this.#drive.set(key, raw);
            }
            break;
          }
          case 'hash': {
            const raw = this.#drive.get(key);
            if (
              typeof raw === 'object' &&
              raw !== null &&
              !Array.isArray(raw) &&
              hasOwn(raw, rest.field)
            ) {
              delete (raw as HashRecord)[rest.field];
              this.#drive.set(key, raw);
            }
            break;
          }
          default:
            throw new Error('TTL malformed at key: ' + key);
        }
        continue;
      }

      switch (rest.type) {
        case 'key':
          this.#create_del_timout(key, dat, false);
          break;
        case 'list':
          this.#create_ldel_timout(key, rest.index, dat, false);
          break;
        case 'hash':
          this.#create_hdel_timout(key, rest.field, dat, false);
          break;
        default:
          throw new Error('TTL malformed at key: ' + key);
      }
    }

    if (needsPersistUpdate) {
      this.#update_ttl_list();
    }
  }

  #create_del_timout(key: HashField, dat: number, updateStorage = true) {
    this.#cancelKeyTTL(key);

    const entry: KeyTTLEntry = {
      type: 'key',
      rawKey: key,
      dat,
      timer: undefined as unknown as ReturnType<typeof setTimeout>,
    };
    entry.timer = this.#scheduleTimer(dat, () => {
      this.#expireKeyEntry(entry);
    });

    this.#keyTTLs.set(this.#normalizeKey(key), entry);

    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #create_ldel_timout(key: HashField, index: number, dat: number, updateStorage = true) {
    this.#cancelListTTLAtIndex(key, index);

    const entry: ListTTLEntry = {
      type: 'list',
      rawKey: key,
      index,
      dat,
      timer: undefined as unknown as ReturnType<typeof setTimeout>,
    };
    entry.timer = this.#scheduleTimer(dat, () => {
      this.#expireListEntry(entry);
    });

    const normKey = this.#normalizeKey(key);
    let entries = this.#listTTLs.get(normKey);
    if (!entries) {
      entries = new Set();
      this.#listTTLs.set(normKey, entries);
    }
    entries.add(entry);

    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #create_hdel_timout(key: HashField, field: HashField, dat: number, updateStorage = true) {
    this.#cancelHashTTLForField(key, field);

    const entry: HashTTLEntry = {
      type: 'hash',
      rawKey: key,
      rawField: field,
      dat,
      timer: undefined as unknown as ReturnType<typeof setTimeout>,
    };
    entry.timer = this.#scheduleTimer(dat, () => {
      this.#expireHashEntry(entry);
    });

    const normKey = this.#normalizeKey(key);
    let fields = this.#hashTTLs.get(normKey);
    if (!fields) {
      fields = new Map();
      this.#hashTTLs.set(normKey, fields);
    }
    fields.set(this.#normalizeKey(field), entry);

    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #cancelKeyTTL(key: HashField): boolean {
    const normKey = this.#normalizeKey(key);
    const entry = this.#keyTTLs.get(normKey);
    if (!entry) {
      return false;
    }
    clearTimeout(entry.timer);
    this.#keyTTLs.delete(normKey);
    return true;
  }

  #cancelListTTLsForKey(key: HashField): boolean {
    const normKey = this.#normalizeKey(key);
    const entries = this.#listTTLs.get(normKey);
    if (!entries || entries.size === 0) {
      return false;
    }
    for (const entry of entries) {
      clearTimeout(entry.timer);
    }
    this.#listTTLs.delete(normKey);
    return true;
  }

  #cancelListTTLAtIndex(key: HashField, index: number): boolean {
    const normKey = this.#normalizeKey(key);
    const entries = this.#listTTLs.get(normKey);
    if (!entries || entries.size === 0) {
      return false;
    }
    let removed = false;
    for (const entry of [...entries]) {
      if (entry.index === index) {
        clearTimeout(entry.timer);
        entries.delete(entry);
        removed = true;
      }
    }
    if (entries.size === 0) {
      this.#listTTLs.delete(normKey);
    }
    return removed;
  }

  #shiftListTTLsAfterDelete(key: HashField, deletedIndex: number) {
    const normKey = this.#normalizeKey(key);
    const entries = this.#listTTLs.get(normKey);
    if (!entries || entries.size === 0) {
      return;
    }

    let changed = false;
    for (const entry of [...entries]) {
      if (entry.index === deletedIndex) {
        clearTimeout(entry.timer);
        entries.delete(entry);
        changed = true;
      } else if (entry.index > deletedIndex) {
        entry.index -= 1;
        changed = true;
      }
    }

    if (entries.size === 0) {
      this.#listTTLs.delete(normKey);
    }

    if (changed) {
      this.#update_ttl_list();
    }
  }

  #cancelHashTTLsForKey(key: HashField): boolean {
    const normKey = this.#normalizeKey(key);
    const fields = this.#hashTTLs.get(normKey);
    if (!fields || fields.size === 0) {
      return false;
    }
    for (const entry of fields.values()) {
      clearTimeout(entry.timer);
    }
    this.#hashTTLs.delete(normKey);
    return true;
  }

  #cancelHashTTLForField(key: HashField, field: HashField): boolean {
    const normKey = this.#normalizeKey(key);
    const fields = this.#hashTTLs.get(normKey);
    if (!fields) {
      return false;
    }
    const normField = this.#normalizeKey(field);
    const entry = fields.get(normField);
    if (!entry) {
      return false;
    }
    clearTimeout(entry.timer);
    fields.delete(normField);
    if (fields.size === 0) {
      this.#hashTTLs.delete(normKey);
    }
    return true;
  }

  #cancelAllTTLsForKey(key: HashField, updateStorage = true): boolean {
    const a = this.#cancelKeyTTL(key);
    const b = this.#cancelListTTLsForKey(key);
    const c = this.#cancelHashTTLsForKey(key);
    const changed = a || b || c;
    if (changed && updateStorage) {
      this.#update_ttl_list();
    }
    return changed;
  }

  #clearAllTTLs() {
    for (const entry of this.#keyTTLs.values()) {
      clearTimeout(entry.timer);
    }
    this.#keyTTLs.clear();

    for (const entries of this.#listTTLs.values()) {
      for (const entry of entries) {
        clearTimeout(entry.timer);
      }
    }
    this.#listTTLs.clear();

    for (const fields of this.#hashTTLs.values()) {
      for (const entry of fields.values()) {
        clearTimeout(entry.timer);
      }
    }
    this.#hashTTLs.clear();
  }

  #expireKeyEntry(entry: KeyTTLEntry, updateStorage = true) {
    const normKey = this.#normalizeKey(entry.rawKey);
    if (this.#keyTTLs.get(normKey) !== entry) {
      return;
    }
    clearTimeout(entry.timer);
    this.#keyTTLs.delete(normKey);
    this.#cancelListTTLsForKey(entry.rawKey);
    this.#cancelHashTTLsForKey(entry.rawKey);
    this.#drive.del(entry.rawKey);
    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #expireListEntry(entry: ListTTLEntry, updateStorage = true) {
    const normKey = this.#normalizeKey(entry.rawKey);
    const entries = this.#listTTLs.get(normKey);
    if (!entries || !entries.has(entry)) {
      return;
    }
    clearTimeout(entry.timer);
    entries.delete(entry);
    if (entries.size === 0) {
      this.#listTTLs.delete(normKey);
    }

    if (this.#drive.exists(entry.rawKey)) {
      const raw = this.#drive.get(entry.rawKey);
      if (Array.isArray(raw) && entry.index >= 0 && entry.index < raw.length) {
        raw[entry.index] = null;
        this.#drive.set(entry.rawKey, raw);
      }
    }

    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #expireHashEntry(entry: HashTTLEntry, updateStorage = true) {
    const normKey = this.#normalizeKey(entry.rawKey);
    const normField = this.#normalizeKey(entry.rawField);
    const fields = this.#hashTTLs.get(normKey);
    if (!fields || fields.get(normField) !== entry) {
      return;
    }
    clearTimeout(entry.timer);
    fields.delete(normField);
    if (fields.size === 0) {
      this.#hashTTLs.delete(normKey);
    }

    if (this.#drive.exists(entry.rawKey)) {
      const raw = this.#drive.get(entry.rawKey);
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        if (hasOwn(raw, entry.rawField)) {
          delete (raw as HashRecord)[entry.rawField];
          this.#drive.set(entry.rawKey, raw);
        }
      }
    }

    if (updateStorage) {
      this.#update_ttl_list();
    }
  }

  #expireDueForKey(key: HashField) {
    const now = Date.now();
    const normKey = this.#normalizeKey(key);
    let changed = false;

    const keyEntry = this.#keyTTLs.get(normKey);
    if (keyEntry && keyEntry.dat <= now) {
      this.#expireKeyEntry(keyEntry, false);
      changed = true;
    }

    const listEntries = this.#listTTLs.get(normKey);
    if (listEntries) {
      for (const entry of [...listEntries]) {
        if (entry.dat <= now) {
          this.#expireListEntry(entry, false);
          changed = true;
        }
      }
    }

    const hashFields = this.#hashTTLs.get(normKey);
    if (hashFields) {
      for (const entry of [...hashFields.values()]) {
        if (entry.dat <= now) {
          this.#expireHashEntry(entry, false);
          changed = true;
        }
      }
    }

    if (changed) {
      this.#update_ttl_list();
    }
  }

  #expireAllDue() {
    const now = Date.now();
    let changed = false;

    for (const entry of [...this.#keyTTLs.values()]) {
      if (entry.dat <= now) {
        this.#expireKeyEntry(entry, false);
        changed = true;
      }
    }

    for (const entries of [...this.#listTTLs.values()]) {
      for (const entry of [...entries]) {
        if (entry.dat <= now) {
          this.#expireListEntry(entry, false);
          changed = true;
        }
      }
    }

    for (const fields of [...this.#hashTTLs.values()]) {
      for (const entry of [...fields.values()]) {
        if (entry.dat <= now) {
          this.#expireHashEntry(entry, false);
          changed = true;
        }
      }
    }

    if (changed) {
      this.#update_ttl_list();
    }
  }

  #update_ttl_list() {
    const ttlList: SerializedTTL[] = [];

    for (const entry of this.#keyTTLs.values()) {
      ttlList.push({
        key: entry.rawKey,
        type: 'key',
        dat: entry.dat,
      });
    }

    for (const entries of this.#listTTLs.values()) {
      for (const entry of entries) {
        ttlList.push({
          key: entry.rawKey,
          type: 'list',
          index: entry.index,
          dat: entry.dat,
        });
      }
    }

    for (const fields of this.#hashTTLs.values()) {
      for (const entry of fields.values()) {
        ttlList.push({
          key: entry.rawKey,
          type: 'hash',
          field: entry.rawField,
          dat: entry.dat,
        });
      }
    }

    if (ttlList.length === 0) {
      this.#drive.del(TTL_LIST_KEY);
    } else {
      this.#drive.set(TTL_LIST_KEY, ttlList);
    }
  }

  /**
   * Delete a key after a certain time.
   *
   * @param key
   * @param value
   * @param seconds
   */
  setex(key: HashKey, value: Serializable, seconds: number) {
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#cancelAllTTLsForKey(key, false);
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
    if (this.#isReservedKey(key)) {
      return;
    }

    this.#expireDueForKey(key);
    const list = this.#get_list(key, true);
    list[index] = value;
    this.#drive.set(key, list);
    this.#cancelListTTLAtIndex(key, index);
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
    if (this.#isReservedKey(key)) {
      return -1;
    }

    this.#expireDueForKey(key);
    const item = this.#keyTTLs.get(this.#normalizeKey(key));
    if (!item) {
      return -1;
    }

    const remaining = item.dat - Date.now();
    if (remaining <= 0) {
      this.#expireKeyEntry(item);
      return -1;
    }

    if (milliseconds) {
      return remaining;
    }

    return Math.floor(remaining / 1000);
  }
}

export { Client };
