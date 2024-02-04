# Memory-based Storage

On this pages you can find examples of using the memory-based storage.

## 1. Create a list of even number and expire each number after 5 seconds

```typescript
import { Client } from '@litehex/storage-box';

const client = new Client();

for (let i = 0; i < 10; i++) {
  client.lsetex('even', i, i * 2, 5);
}

setTimeout(() => {
  console.log(client.lget('even', 0)); // undefined
}, 5000);
```
