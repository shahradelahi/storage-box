import { Client } from '@/index.ts';
import { expect } from 'chai';

describe('Memory-based - Basic usage', () => {
  const client = new Client();

  beforeEach(() => {
    client.clear();
  });

  it('Set and get', () => {
    client.set('foo', 'bar');
    expect(client.get('foo')).to.equal('bar');
  });

  it('Delete', () => {
    client.set('foo', 'bar');
    client.del('foo');
    expect(client.get('foo')).to.be.null;
  });

  it('Exists/Has', () => {
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
});

describe('Memory-based - Key expiration', () => {
  const client = new Client();

  beforeEach(() => {
    client.clear();
  });

  it('Set and get', async () => {
    client.setex('foo', 'bar', 1);
    expect(client.get('foo')).to.equal('bar');
    await sleep(1100);
    expect(client.get('foo')).to.be.null;
  });

  it('List set and get', async () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    client.lsetex('foo', 1, 'bar', 1);
    expect(client.lget('foo', 1)).to.equal('bar');
    await sleep(1100);
    expect(client.lget('foo', 1)).to.be.null;
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

describe('List operations', () => {
  const c = new Client();
  beforeEach(() => {
    c.clear();
  });

  it('List - Get entry values in list', () => {
    c.lpush('foo', 'bar');
    c.lpush('foo', 'foo');
    c.lpush('foo', 'baz');
    expect(c.list('foo')).to.have.members(['baz', 'foo', 'bar']);
  });

  it('Clear - Reset list to empty state', () => {
    c.set('foo', 'bar');
    c.set('bar', 'foo');
    c.clear();
    expect(c.keys()).to.be.empty;
  });

  it('List set', () => {
    c.lpush('foo', 'bar');
    c.lpush('foo', 'foo');
    c.lpush('foo', 'baz');
    c.lset('foo', 1, 'bar');
    expect(c.list('foo')).to.have.members(['baz', 'bar', 'bar']);
  });

  it('List get', () => {
    c.lpush('foo', 'bar');
    c.lpush('foo', 'foo');
    c.lpush('foo', 'baz');
    expect(c.lget('foo', 1)).to.equal('foo');
  });

  it('List range', () => {
    c.lpush('foo', 'bar');
    c.lpush('foo', 'foo');
    c.lpush('foo', 'baz');
    expect(c.list('foo')).to.have.members(['baz', 'foo', 'bar']);
    expect(c.lrange('foo', 0, 2)).to.have.members(['foo', 'bar']);
  });
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
