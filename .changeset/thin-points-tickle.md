---
"storage-box": minor
---

feat: Added `createHashMap` method to create an instance of a HashMap.

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
