import { beforeEach, describe, expect, it } from 'vitest';

import { Client } from '@/client';
import { TTL_LIST_KEY } from '@/constants';
import { sleep } from '@/tests/utils';

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

describe('Bug reproduction reports', () => {
  it('1. A later write cancels the old TTL', async () => {
    const a = new Client();
    a.setex('session', 'old', 1);
    a.set('session', 'new');
    expect(a.ttl('session')).to.equal(-1);

    await sleep(1100);
    expect(a.get('session')).to.equal('new');
  });

  it('2. List TTL element shifting', async () => {
    const b = new Client();
    b.lpushex('jobs', 'tmp', 1);
    b.lpush('jobs', 'a');
    b.lpush('jobs', 'b');
    b.ldel('jobs', 0);
    expect(b.lgetall('jobs')).to.deep.equal(['a', 'b']);

    await sleep(1100);
    expect(b.lgetall('jobs')).to.deep.equal(['a', 'b']);
  });

  it('3. __TTL_LIST-DONT_USE__ is hidden', () => {
    const c = new Client();
    c.setex('k', 'v', 60);
    expect(c.keys()).to.deep.equal(['k']);
    expect(c.values()).to.deep.equal(['v']);
    expect(c.getall()).to.deep.equal({ k: 'v' });
    expect(c.has(TTL_LIST_KEY)).to.be.false;
  });

  it('4. Inherited property names do not count as keys', () => {
    const d = new Client();
    expect(d.has('constructor')).to.be.false;
    expect(d.has('toString')).to.be.false;

    d.hset('h', '__proto__', 'x');
    expect(d.hexists('h', '__proto__')).to.be.true;
    expect(d.hget('h', '__proto__')).to.equal('x');
    expect(d.hkeys('h')).to.deep.equal(['__proto__']);
    expect(d.hgetall('h')['__proto__']).to.equal('x');
  });
});
