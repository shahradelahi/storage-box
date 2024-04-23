# Browser Storage

On this pages you can find examples of using the browser-based storages.

## 1. Store a value with expiration time on the local storage

```typescript
import { Client, BrowserDriver } from 'storage-box';

const driver = new BrowserDriver('local');
const client = new Client(driver);

await client.setex('key', 'value', 5);

const value = await client.get('key');

console.log(value);
setTimeout(async () => {
  console.log(await client.get('key')); // undefined
}, 5000);
```
