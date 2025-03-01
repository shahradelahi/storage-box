import { promises } from 'node:fs';
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

  after(async () => {
    promises.unlink(filePath).catch(() => {});
  });

  it('Set and get', () => {
    client.set('foo', 'bar');
    client.set('bar', 'baz');
    expect(client.get('foo')).to.equal('bar');
  });

  it('Delete', () => {
    client.set('foo', 'bar');
    client.del('foo');
    expect(client.get('foo')).to.be.null;
  });

  describe('Time-based', () => {
    const filePath = resolve('tests', 'output', 'test.json');

    after(async () => {
      await promises.unlink(filePath).catch(() => {});
    });

    it('create a key with expiration and reload again', async () => {
      {
        const drive = new FsDriver(filePath);
        const client = new Client(drive);

        client.setex('foo', 'bar', 2);
      }
      await sleep(2001);
      {
        const drive = new FsDriver(filePath);
        const client = new Client(drive);

        expect(client.exists('foo')).to.false;
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

    after(async () => {
      await promises.unlink(filePath).catch(() => {});
    });

    it('Set and get', () => {
      client.set('foo', 'bar');
      client.set('bar', 'baz');
      expect(client.get('foo')).to.equal('bar');
    });

    it('Delete', () => {
      client.setex('foo', 'bar', 1);
      client.setex('bar', 'baz', 1);
      client.set('foo', 'bar');

      client.del('foo');

      expect(client.get('foo')).to.be.null;
    });
  });
});
