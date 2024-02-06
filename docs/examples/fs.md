# File-based Storage (fs)

On this page, you can find examples of using the file-based storage. This feature is available only in Node.js and Bun
environments.

## 1. Store a value

```typescript
import { Client } from '@litehex/storage-box';
import { FsDriver } from '@litehex/storage-box/driver';
import { resovle } from 'path';

const filePath = resovle(process.cwd(), 'data.json');
const driver = new FsDriver(filePath);
const client = new Client(driver);

client.set('key', 'value');

const value = client.get('key');

console.log(value);
```

## 3. Use `msgpack` serializer

By default `JSON` serializer is used. You can use following code to use `msgpack` serializer.

```typescript
import { Client } from '@litehex/storage-box';
import { FsDriver } from '@litehex/storage-box/driver';
import { MSGPack } from '@litehex/storage-box/parser';

const filePath = resovle(process.cwd(), 'data.pack');
const driver = new FsDriver(filePath, { parser: MSGPack });
const client = new Client(driver);

client.set('key', 'value');

const value = client.get('key');

console.log(value);
```
