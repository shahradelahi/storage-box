# Browser Storage

On this page, you can find details of using the browser-based storages.

## 1. Store a value with expiration time on the local storage

```typescript
import { Client } from 'storage-box';
import { BrowserDriver } from 'storage-box/browser';

const driver = new BrowserDriver('local');
const client = new Client(driver);

client.setex('key', 'value', 5);

const value = client.get('key');

console.log(value);
setTimeout(() => {
  console.log(client.get('key')); // undefined
}, 5000);
```
