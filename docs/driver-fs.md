# File-based Storage (fs)

On this page, you can find a detailed description of how to use file-based driver.

### Usage

```typescript
import { resovle } from 'node:path';
import { Client } from 'storage-box';
import { FsDriver } from 'storage-box/node';

const filePath = resovle(process.cwd(), 'data.json');
const driver = new FsDriver(filePath);

const client = new Client(driver);
```

### Serializer / Parser

##### JSON

By default, the `fs` driver uses the `JSON` serializer. So you don't need to pass any option to the `FsDriver`
constructor.

##### MessagePack

One of the benefits of using the `msgpack` serializer is that it is faster and more efficient than the `JSON`
serializer.

You can check out more info about it [here](https://msgpack.org/).

```typescript
import { FsDriver, MSGPack } from 'storage-box';

const filePath = resovle(process.cwd(), 'data.b64');
const driver = new FsDriver(filePath, { parser: MSGPack });
```

### Limitations

The `fs` driver only supports `Node.js` and `Bun` environments.

If you have large JavaScript objects (`<=6MB`) you may hit some performance issues. This is because whenever make changes
it will write the whole objects to the file.

If you plan to scale, it's highly recommended to use databases like `PostgreSQL` or `MongoDB` instead.
