import { expect } from 'chai';

import { Client } from '@/client';

describe('List operations', () => {
  const c = new Client();
  beforeEach(async () => {
    await c.clear();
  });

  it('List - Get entry values in list', async () => {
    await c.lpush('foo', 'bar');
    await c.lpush('foo', 'foo');
    await c.lpush('foo', 'baz');
    expect(await c.lgetall('foo')).to.have.members(['baz', 'foo', 'bar']);
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
    expect(await c.lgetall('foo')).to.have.members(['baz', 'bar', 'bar']);
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
    expect(await c.lgetall('foo')).to.have.members(['baz', 'foo', 'bar']);
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
      foo: 'bar',
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
