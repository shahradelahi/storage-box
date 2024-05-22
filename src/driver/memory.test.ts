import { expect } from 'chai';

import { Client } from '@/client';
import { sleep } from '@/tests/utils';

describe('In-Memory', () => {
  const client = new Client();

  beforeEach(async () => {
    await client.clear();
  });

  it('Set and get', async () => {
    await client.set('foo', 'bar');
    const value = await client.get('foo');

    expect(value).to.equal('bar');
  });

  it('Delete', async () => {
    await client.set('foo', 'bar');
    await client.del('foo');

    const value = await client.get('foo');

    expect(value).to.be.null;
  });

  it('Exists', async () => {
    await client.set('foo', 'bar');
    expect(await client.has('foo')).to.be.true;

    await client.del('foo');
    expect(await client.exists('foo')).to.be.false;
  });

  it('Keys', async () => {
    await client.set('foo', 'bar');
    await client.set('bar', 'foo');
    expect(await client.keys()).to.have.members(['foo', 'bar']);
  });

  describe('Time-based', () => {
    const client = new Client();

    beforeEach(async () => {
      await client.clear();
    });

    it('Set and get', async () => {
      await client.setex('foo', 'bar', 3);
      expect(await client.get('foo')).to.equal('bar');
      await sleep(1000);
      expect(await client.get('foo')).to.equal('bar');

      await sleep(2000);
      expect(await client.get('foo')).to.be.null;
    });

    it('List - set and get', async () => {
      await client.lpushex('list', 'bar', 2);
      await client.lpush('list', 'foo');
      await client.lpush('list', 'baz');
      await client.lsetex('list', 1, 'bar', 1);

      expect(await client.lget('list', 1)).to.equal('bar');

      await sleep(1000);
      expect(await client.lget('list', 1)).to.be.null;

      await sleep(1000);
      expect(await client.lget('list', 0)).to.be.null;
    });

    it('Hash - Time-based set and get', async () => {
      await client.hsetex('foo', 'field', 'bar', 1);
      expect(await client.hget('foo', 'field')).to.equal('bar');
      await sleep(1100);
      expect(await client.hget('foo', 'field')).to.be.null;
    });

    it('should get the key TTL', async () => {
      await client.setex('foo', 'bar', 2);
      expect(await client.ttl('foo')).to.be.greaterThanOrEqual(0);
      await sleep(2100);
      expect(await client.ttl('foo')).to.equal(-1);
    });

    it('should get TTL in milliseconds', async () => {
      await client.setex('foo', 'bar', 2);
      expect(await client.ttl('foo', true)).to.be.greaterThanOrEqual(1000);
      await sleep(2100);
      expect(await client.ttl('foo', true)).to.equal(-1);
    });
  });
});
