# storage-box

> Storing data in key-value structure to multiple different storages.

[![npm](https://img.shields.io/npm/v/p-safe)](https://www.npmjs.com/package/p-safe)
[![npm bundle size](https://packagephobia.now.sh/badge?p=p-safe)](https://packagephobia.now.sh/result?p=p-safe)

### Notable Features

- Easy to use API
- Support for **Node.js**, **Bun** and the **browser**
- Support for multiple storage types (memory, file, local storage, etc.)
- Support for time-based expiration

### Installation

```bash
npm install @litehex/storage-box
```

### 📖 Usage

```typescript
import { Client } from '@litehex/storage-box';

const client = new Client();

client.setex('key', 'value', 2);

console.log(client.get('key')); // value

// time to live in milliseconds
console.log(client.ttl('key', true)); // 2000

// after 3 seconds
setTimeout(() => {
  console.log(client.get('key')); // undefined
}, 3e3);
```

### 📦 Storage Types

- Memory ([Examples](docs/examples/memory.md))
- File-based (Fs) ([Examples](docs/examples/fs.md))
- Local/Session Storage ([Examples](docs/examples/browser.md))

### 📚 Documentation

For all configuration options, please see [the API docs](https://paka.dev/npm/@litehex/storage-box@canary/api#module-index-export-Options).

### Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/storage-box). Feel free to contribute, we care about your ideas and
suggestions.

### License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
