# storage-box

A library for storing data in key-value pairs in multiple different storages.

## Notable Features

- Easy to use API
- Support for Node.js, Bun and the browser
- Support for multiple storage types (memory, file, local storage, etc.)
- Support for time-based expiration

## Installation

```bash
npm install @litehex/storage-box
```

## Usage

```typescript
import { Client } from '@litehex/storage-box';

const client = new Client();

client.setex('key', 'value', 2);

console.log(client.get('key')); // value
console.log(client.ttl('key', true)); // ~2000 ms

setTimeout(() => {
  console.log(client.get('key')); // undefined
}, 3e3);
```

## Supported Storages

- Memory ([Examples](docs/examples/memory.md))
- File-based (Fs) ([Examples](docs/examples/fs.md))
- Local/Session Storage ([Examples](docs/examples/browser.md))

## API

- [Client](docs/api/client.md)

## Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/storage-box). Feel free to contribute, we care about your ideas and
suggestions.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details
