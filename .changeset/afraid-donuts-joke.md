---
"storage-box": major
---

BREAKING: The exported paths of the package have changed for both `BrowserDriver` and `FsDriver`.

```diff
- import { BrowserDriver, FsDriver } from 'storage-box';
+ import { BrowserDriver } from 'storage-box/browser';
+ import { FsDriver } from 'storage-box/node';
```
