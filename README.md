# storage-box

[![CI](https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml/badge.svg)](https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/storage-box)](https://www.npmjs.com/package/storage-box)
[![npm bundle size](https://packagephobia.now.sh/badge?p=storage-box)](https://packagephobia.now.sh/result?p=storage-box)
[![MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Storing data in various structures across multiple storage systems.

### Notable Features

- Easy to use API
- Support for **Node.js**, **Bun** and the **browser**
- Support for multiple storage types (memory, file, local storage, etc.)
- Multiple data structures (literals, hashes, lists, etc.)
- Time-based key expiration

### Installation

```bash
npm i storage-box
```

### 📖 Usage

```typescript
import { Client } from 'storage-box';

const client = new Client();

await client.setex('key', 'value', 2);

console.log(await client.get('key')); // value

// time to live in milliseconds
console.log(await client.ttl('key', true)); // 2000

// after 3 seconds
setTimeout(async () => {
  console.log(await client.get('key')); // undefined
}, 3e3);
```

### 📦 Storage Types

- Memory ([Docs](docs/driver-memory.md)) (default)
- File-based (Fs) ([Docs](docs/driver-fs.md))
- Local/Session Storage ([Docs](docs/driver-browser.md))

### 📚 Documentation

For all configuration options, please see [the API docs](https://paka.dev/npm/storage-box/api).

### 🤝 Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/storage-box). Feel free to contribute, we care about your ideas and
suggestions.

### License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
