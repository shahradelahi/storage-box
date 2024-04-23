# Memory-based Storage

By default, the memory-based storage is used. On this page, you can find examples of using the memory-based storage.

## 1. Create a list of even numbers and expire each number after 5 seconds

```typescript
import { Client } from 'storage-box';

const client = new Client();

for (let i = 0; i < 10; i++) {
  await client.lsetex('even', i, i * 2, 5);
}

setTimeout(async () => {
  console.log(await client.lget('even', 0)); // undefined
}, 5000);
```
