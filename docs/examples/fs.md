# File-based Storage (fs)

On this pages you can find examples of using the file-based storage. This feature is available only in Node.js and Bun environments.

## 1. Store a value

```typescript
import { Client } from '@litehex/storage-box';
import { FsDriver } from '@litehex/storage-box/driver/fs';
import { resovle } from 'path';

const filePath = resovle(process.cwd(), 'data.json');
const driver = new FsDriver(filePath);
const client = new Client(driver);

client.set('key', 'value');

const value = client.get('key');

console.log(value);
```
