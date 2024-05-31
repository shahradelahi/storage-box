import { expect } from 'chai';

import { Client } from '@/client';

describe('List operations', () => {
  const client = new Client();
  beforeEach(() => {
    client.clear();
  });

  it('List - Get entry values in list', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    expect(client.lgetall('foo')).to.have.members(['baz', 'foo', 'bar']);
  });

  it('Clear - Reset list to empty state', () => {
    client.set('foo', 'bar');
    client.set('bar', 'foo');
    client.clear();
    expect(client.keys()).to.be.empty;
  });

  it('List set', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    client.lset('foo', 1, 'bar');
    expect(client.lgetall('foo')).to.have.members(['baz', 'bar', 'bar']);
  });

  it('List get', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    expect(client.lget('foo', 1)).to.equal('foo');
  });

  it('List range', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    expect(client.lgetall('foo')).to.have.members(['baz', 'foo', 'bar']);
    expect(client.lrange('foo', 0, 2)).to.have.members(['foo', 'bar']);
  });
});

describe('Hash operations', () => {
  const client = new Client();
  beforeEach(() => {
    client.clear();
  });

  it('Hash set and get', () => {
    client.hset('foo', 'bar', 'baz');
    expect(client.hget('foo', 'bar')).to.equal('baz');
  });

  it('Hash get all', () => {
    client.hset('foo', 'bar', 'baz');
    client.hset('foo', 'foo', 'bar');
    client.hset('foo', 'bar', 'baz');

    const values = client.hgetall('foo');

    const expected = {
      bar: 'baz',
      foo: 'bar',
    };

    expect(Object.keys(values)).to.have.members(Object.keys(expected));

    for (const [key, value] of Object.entries(expected)) {
      expect(values).have.property(key, value);
    }
  });

  it('Hash delete', () => {
    client.hset('foo', 'bar', 'baz');
    client.hdel('foo', 'bar');

    expect(client.hget('foo', 'bar')).to.be.null;
  });
});
