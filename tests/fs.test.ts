import { Client, FsDriver, MSGPack } from '@litehex/storage-box';
import { expect } from 'chai';
import fs from 'fs';
import { resolve } from 'path';
import { sleep } from './utils.ts';

describe('Fs-based storage', () => {
  const filePath = resolve(process.cwd(), 'tests', 'test.json');

  using drive = new FsDriver(filePath);
  const client = new Client(drive);

  beforeEach(() => {
    client.clear();
  });

  after(() => {
    fs.unlinkSync(filePath);
  });

  it('Set and get', async () => {
    await client.set('foo', 'bar');
    await client.set('bar', 'baz');
    expect(await client.get('foo')).to.equal('bar');
  });

  it('Delete', async () => {
    await client.set('foo', 'bar');
    await client.del('foo');
    expect(await client.get('foo')).to.be.null;
  });
});

describe('Fs-based - TTL', () => {
  const filePath = resolve(process.cwd(), 'tests', 'test.json');

  after(() => {
    fs.unlinkSync(filePath);
  });

  it('create a key with expiration and reload again', async () => {
    {
      using drive = new FsDriver(filePath);
      const client = new Client(drive);

      await client.setex('foo', 'bar', 2);
    }
    await sleep(2001);
    {
      using drive = new FsDriver(filePath);
      const client = new Client(drive);

      expect(await client.exists('foo')).to.false;
    }
  });
});

describe('Fs-based storage - MSGPack', () => {
  const filePath = resolve(process.cwd(), 'tests', 'test.pack');

  using drive = new FsDriver(filePath, { parser: MSGPack });
  const client = new Client(drive);

  beforeEach(() => {
    client.clear();
  });

  after(() => {
    fs.unlinkSync(filePath);
  });

  it('Set and get', async () => {
    await client.set('foo', 'bar');
    await client.set('bar', 'baz');
    expect(await client.get('foo')).to.equal('bar');
  });

  it('Delete', async () => {
    await client.set('foo', 'bar');
    await client.del('foo');
    expect(await client.get('foo')).to.be.null;
  });
});
