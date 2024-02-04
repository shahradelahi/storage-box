# Browser Storage

On this pages you can find examples of using the browser-based storages.

## 1. Store a value with expiration time on the local storage

```typescript
import { Client } from '@litehex/storage-box';
import { BrowserDriver } from '@litehex/storage-box/browser';

const driver = new BrowserDriver('local');
const client = new Client(driver);

client.setex('key', 'value', 5);

const value = client.get('key');

console.log(value);
setTimeout(() => {
  console.log(client.get('key')); // undefined
}, 5000);
```
