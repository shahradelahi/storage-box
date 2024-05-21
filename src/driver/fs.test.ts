import fs from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'chai';

import { Client } from '@/client';
import { FsDriver } from '@/node';
import { MSGPack } from '@/parser/msg-pack';
import { sleep } from '@/tests/utils';

describe('Fs-based storage', () => {
  const filePath = resolve('tests', 'output', 'test.json');

  const drive = new FsDriver(filePath);
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

  describe('Time-based', () => {
    const filePath = resolve('tests', 'output', 'test.json');

    it('create a key with expiration and reload again', async () => {
      {
        const drive = new FsDriver(filePath);
        const client = new Client(drive);

        await client.setex('foo', 'bar', 2);
      }
      await sleep(2001);
      {
        const drive = new FsDriver(filePath);
        const client = new Client(drive);

        expect(await client.exists('foo')).to.false;
      }
    });
  });

  describe('MSGPack Parser', () => {
    const filePath = resolve('tests', 'output', 'test.b64');

    const drive = new FsDriver(filePath, { parser: MSGPack });
    const client = new Client(drive);

    beforeEach(() => {
      client.clear();
    });

    it('Set and get', async () => {
      await client.set('foo', 'bar');
      await client.set('bar', 'baz');
      expect(await client.get('foo')).to.equal('bar');
    });

    it('Delete', async () => {
      await client.setex('foo', 'bar', 1);
      await client.setex('bar', 'baz', 1);
      await client.set('foo', 'bar');

      await client.del('foo');

      expect(await client.get('foo')).to.be.null;
    });
  });
});
