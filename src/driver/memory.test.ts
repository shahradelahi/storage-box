import { expect } from 'chai';

import { Client } from '@/client';
import { sleep } from '@/tests/utils';

describe('In-Memory', () => {
  const client = new Client();

  beforeEach(() => {
    client.clear();
  });

  it('Set and get', () => {
    client.set('foo', 'bar');
    const value = client.get('foo');

    expect(value).to.equal('bar');
  });

  it('Delete', () => {
    client.set('foo', 'bar');
    client.del('foo');

    const value = client.get('foo');

    expect(value).to.be.null;
  });

  it('Exists', () => {
    client.set('foo', 'bar');
    expect(client.has('foo')).to.be.true;

    client.del('foo');
    expect(client.exists('foo')).to.be.false;
  });

  it('Keys', () => {
    client.set('foo', 'bar');
    client.set('bar', 'foo');
    expect(client.keys()).to.have.members(['foo', 'bar']);
  });

  describe('Time-based', () => {
    const client = new Client();

    beforeEach(() => {
      client.clear();
    });

    it('Set and get', async () => {
      client.setex('foo', 'bar', 3);
      expect(client.get('foo')).to.equal('bar');
      await sleep(1000);
      expect(client.get('foo')).to.equal('bar');

      await sleep(2000);
      expect(client.get('foo')).to.be.null;
    });

    it('List - set and get', async () => {
      client.lpushex('list', 'bar', 2);
      client.lpush('list', 'foo');
      client.lpush('list', 'baz');
      client.lsetex('list', 1, 'bar', 1);

      expect(client.lget('list', 1)).to.equal('bar');

      await sleep(1000);
      expect(client.lget('list', 1)).to.be.null;

      await sleep(1000);
      expect(client.lget('list', 0)).to.be.null;
    });

    it('Hash - Time-based set and get', async () => {
      client.hsetex('foo', 'field', 'bar', 1);
      expect(client.hget('foo', 'field')).to.equal('bar');
      await sleep(1100);
      expect(client.hget('foo', 'field')).to.be.null;
    });

    it('should get the key TTL', async () => {
      client.setex('foo', 'bar', 2);
      expect(client.ttl('foo')).to.be.greaterThanOrEqual(0);
      await sleep(2100);
      expect(client.ttl('foo')).to.equal(-1);
    });

    it('should get TTL in milliseconds', async () => {
      client.setex('foo', 'bar', 2);
      expect(client.ttl('foo', true)).to.be.greaterThanOrEqual(1000);
      await sleep(2100);
      expect(client.ttl('foo', true)).to.equal(-1);
    });
  });
});
