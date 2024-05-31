# storage-box

## 1.0.0

### Major Changes

- 789d49a: BREAKING: The exported paths of the package have changed for both `BrowserDriver` and `FsDriver`.

  ```diff
  - import { BrowserDriver, FsDriver } from 'storage-box';
  + import { BrowserDriver } from 'storage-box/browser';
  + import { FsDriver } from 'storage-box/node';
  ```

- 789d49a: BREAKING: the `list` method has been renamed to `lgetall`
- ce4fd52: fix: Operation methods are now synchronous. The keyword `await` is no longer needed.

### Minor Changes

- 789d49a: feat: `createList` method to create an instance of a list

  ```typescript
  import { Client } from 'storage-box';

  const c = new Client();

  const nl = c.createList<number>();
  for (let i = 0; i < 10; i++) {
    nl.push(i);
  }
  console.log(nl.range(0, 3));
  ```

- 789d49a: feat: Added `createHashMap` method to create an instance of a HashMap.

  ```typescript
  import { Client } from 'storage-box';

  const c = new Client();

  interface Vertex {
    x: number;
    y: number;
  }

  const vhm = c.createHashMap<string, Vertex>();
  vhm.set('a', { x: 1, y: 2 });
  ```

### Patch Changes

- 789d49a: fix: added `getall` to extract entry storage as a record/key-value object
- f4ede69: feat: added `pushex` and `exists` operations for list

## 0.3.1

### Patch Changes

- d9324db: fix: optimize typings and remove unnecessary dependencies (#28)
- 44643f4: chore(driver/fs): slightly improve `bouncy-write` feature (#26)
