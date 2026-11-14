<h1 align="center">
  <sup>storage-box</sup>
  <br>
  <a href="https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml"><img src="https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml/badge.svg?branch=main&event=push" alt="CI"></a>
  <a href="https://www.npmjs.com/package/storage-box"><img src="https://img.shields.io/npm/v/storage-box.svg" alt="NPM Version"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat" alt="MIT License"></a>
  <a href="https://bundlephobia.com/package/storage-box"><img src="https://img.shields.io/bundlephobia/minzip/storage-box" alt="npm bundle size"></a>
  <a href="https://packagephobia.com/result?p=storage-box"><img src="https://packagephobia.com/badge?p=storage-box" alt="Install Size"></a>
</h1>

_storage-box_ is a versatile JavaScript key–value storage library supporting memory, file system, and browser drivers with expiration and rich data structures.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#license)

## 📦 Installation

```bash
npm install storage-box
```

<details>
<summary>Install using your favorite package manager</summary>

**pnpm**

```bash
pnpm install storage-box
```

**yarn**

```bash
yarn add storage-box
```

</details>

## 📖 Usage

### Basic Usage

```ts
import { Client } from 'storage-box';

const client = new Client();

client.set('key', 'value');
console.log(client.get('key')); // 'value'
```

### Storage Drivers

#### Memory (Default)

In-memory storage driver requiring zero setup.

```ts
import { Client, MemoryDriver } from 'storage-box';

const client = new Client(new MemoryDriver());
```

#### File-based Storage (fs)

File system driver supporting Node.js and Bun environments with JSON or MessagePack serialization.

```ts
import path from 'node:path';
import { FsDriver, MSGPack } from 'storage-box/node';
import { Client } from 'storage-box';

// JSON file storage (default)
const jsonDriver = new FsDriver(path.resolve('data.json'));
const client = new Client(jsonDriver);

// MessagePack binary storage
const msgpackDriver = new FsDriver(path.resolve('data.b64'), {
  parser: MSGPack,
});
const mpClient = new Client(msgpackDriver);
```

#### Browser Storage

Local or Session storage driver for web applications.

```ts
import { Client } from 'storage-box';
import { BrowserDriver } from 'storage-box/browser';

const driver = new BrowserDriver('local'); // or 'session'
const client = new Client(driver);

client.set('theme', 'dark');
```

### Automatic Key Expiration (TTL)

Set keys with expiration time in seconds and inspect remaining TTL.

```ts
import { Client } from 'storage-box';

const client = new Client();

client.setex('session', 'secret-token', 10); // expires in 10 seconds

console.log(client.ttl('session')); // remaining time in seconds
console.log(client.ttl('session', true)); // remaining time in milliseconds
```

### Hash Operations

Store key-value pairs inside nested hash structures.

```ts
import { Client } from 'storage-box';

const client = new Client();

client.hset('user:100', 'name', 'John');
client.hset('user:100', 'email', 'john@example.com');

console.log(client.hget('user:100', 'name')); // 'John'
console.log(client.hgetall('user:100')); // { name: 'John', email: 'john@example.com' }
```

### List Operations

Work with ordered arrays and push/pop elements.

```ts
import { Client } from 'storage-box';

const client = new Client();

client.lpush('tasks', 'write docs');
client.lpush('tasks', 'publish package');

console.log(client.lpop('tasks')); // 'publish package'
console.log(client.lrange('tasks', 0, -1)); // ['write docs']
```

### Custom HashMap & List Classes

Extend `HashMap` or `List` for custom data structures and domain logic.

```ts
import { Client, HashMap } from 'storage-box';

interface User {
  first: string;
  last: string;
}

class UserMap extends HashMap<string, User> {
  async getInitials(): Promise<string[]> {
    const all = await this.getall();
    return Object.values(all).map((u) => `${u.first[0]}${u.last[0]}`);
  }
}

const users = client.createHashMap('users', UserMap);
await users.set('u1', { first: 'John', last: 'Doe' });
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/storage-box).

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/storage-box).

Thanks again for your support, it is much appreciated! 🙏

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/storage-box/graphs/contributors).
