---
"storage-box": minor
---

feat: `createList` method to create an instance of a list

```typescript
import { Client } from 'storage-box';

const c = new Client();

const nl = c.createHashMap<number>();
for (let i = 0; i < 10; i++) {
  nl.push(i);
}
console.log(nl.range(0, 3));
```
