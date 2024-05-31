<h1 align="center">
<sup>StorageBox</sup>
<br>
<a href="https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml"><img src="https://github.com/shahradelahi/storage-box/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
<a href="https://www.npmjs.com/package/storage-box"><img src="https://img.shields.io/npm/v/storage-box" alt="npm"></a>
<a href="https://packagephobia.now.sh/result?p=storage-box"><img src="https://packagephobia.now.sh/badge?p=storage-box" alt="npm bundle size"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT"></a>
</h1>

_storage-box_ is a JavaScript library designed for the purpose of storing data in various structures across multiple
storage systems. The primary goal of this library is to offer a straightforward and effective method for data storage.

## 👀 Features

- Simple API
- Support for **Node.js**, **Bun** and the **browser**
- Support for multiple storage types (Memory, File, Browser-storage, etc.)
- Multiple data structures (Literals, Hashes, Lists, etc.)
- Time-based key expiration

## ⚙️ Installation

```bash
npm i storage-box
```

## 📖 Usage

```typescript
import { Client } from 'storage-box';

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

## 📦 Storage Types

- Memory ([Docs](docs/driver-memory.md)) (default)
- File-based (Fs) ([Docs](docs/driver-fs.md))
- Local/Session Storage ([Docs](docs/driver-browser.md))

## 📚 Documentation

For all configuration options, please see [the API docs](https://paka.dev/npm/storage-box/api).

## 🤝 Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/storage-box). Feel free to contribute, we care about your ideas and
suggestions.

## Project Stats

![Alt](https://repobeats.axiom.co/api/embed/e1a9aca6e883cd81bba207c4edb9713c24796edd.svg 'Repobeats analytics image')

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
