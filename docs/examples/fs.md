# File-based Storage (fs)

On this page, you can find examples of how to use file-based storage. This feature is only available in Node.js and Bun
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

## 2. Use `msgpack` serializer

One of the benefits of using the `msgpack` serializer is that it is faster and more efficient than the `JSON`
serializer. By default, the `JSON` serializer is used. To use the `msgpack` serializer, you need to pass it as an option
to the `FsDriver` constructor.

```typescript
import { Client, MSGPack } from '@litehex/storage-box';
import { FsDriver } from '@litehex/storage-box/driver';
import { resovle } from 'path';

const filePath = resovle(process.cwd(), 'data.pack');
const driver = new FsDriver(filePath, { parser: MSGPack });

const client = new Client(driver);

client.set('key', 'value');
const value = client.get('key');

console.log(value);
```
