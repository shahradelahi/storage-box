import { Client } from '@litehex/storage-box';
import { expect } from 'chai';
import { sleep } from './utils.ts';

describe('Memory-based - Basic usage', () => {
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

  it('Exists/Has', async () => {
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
});

describe('Memory-based - TTL', () => {
  const client = new Client();

  beforeEach(async () => {
    await client.clear();
  });

  it('Set and get', async () => {
    await client.setex('foo', 'bar', 1);
    expect(await client.get('foo')).to.equal('bar');
    await sleep(1100);
    expect(await client.get('foo')).to.be.null;
  });

  it('List - set and get', async () => {
    await client.lpush('foo', 'bar');
    await client.lpush('foo', 'foo');
    await client.lpush('foo', 'baz');
    await client.lsetex('foo', 1, 'bar', 1);

    expect(await client.lget('foo', 1)).to.equal('bar');

    await sleep(1100);

    expect(await client.lget('foo', 1)).to.be.null;
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

describe('List operations', () => {
  const c = new Client();
  beforeEach(async () => {
    await c.clear();
  });

  it('List - Get entry values in list', async () => {
    await c.lpush('foo', 'bar');
    await c.lpush('foo', 'foo');
    await c.lpush('foo', 'baz');
    expect(await c.list('foo')).to.have.members(['baz', 'foo', 'bar']);
  });

  it('Clear - Reset list to empty state', async () => {
    await c.set('foo', 'bar');
    await c.set('bar', 'foo');
    await c.clear();
    expect(await c.keys()).to.be.empty;
  });

  it('List set', async () => {
    await c.lpush('foo', 'bar');
    await c.lpush('foo', 'foo');
    await c.lpush('foo', 'baz');
    await c.lset('foo', 1, 'bar');
    expect(await c.list('foo')).to.have.members(['baz', 'bar', 'bar']);
  });

  it('List get', async () => {
    await c.lpush('foo', 'bar');
    await c.lpush('foo', 'foo');
    await c.lpush('foo', 'baz');
    expect(await c.lget('foo', 1)).to.equal('foo');
  });

  it('List range', async () => {
    await c.lpush('foo', 'bar');
    await c.lpush('foo', 'foo');
    await c.lpush('foo', 'baz');
    expect(await c.list('foo')).to.have.members(['baz', 'foo', 'bar']);
    expect(await c.lrange('foo', 0, 2)).to.have.members(['foo', 'bar']);
  });
});

describe('Hash operations', () => {
  const c = new Client();
  beforeEach(async () => {
    await c.clear();
  });

  it('Hash set and get', async () => {
    await c.hset('foo', 'bar', 'baz');
    expect(await c.hget('foo', 'bar')).to.equal('baz');
  });

  it('Hash get all', async () => {
    await c.hset('foo', 'bar', 'baz');
    await c.hset('foo', 'foo', 'bar');
    await c.hset('foo', 'bar', 'baz');

    const values = await c.hgetall('foo');

    const expected = {
      bar: 'baz',
      foo: 'bar'
    };

    expect(Object.keys(values)).to.have.members(Object.keys(expected));

    for (const [key, value] of Object.entries(expected)) {
      expect(values).have.property(key, value);
    }
  });

  it('Hash delete', async () => {
    await c.hset('foo', 'bar', 'baz');
    await c.hdel('foo', 'bar');

    expect(await c.hget('foo', 'bar')).to.be.null;
  });
});
