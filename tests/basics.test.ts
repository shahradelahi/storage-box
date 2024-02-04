import { Client } from '@/index.ts';
import { expect } from 'chai';

describe('In-memory basic usage', () => {
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

  it('Exists', () => {
    client.set('foo', 'bar');
    expect(client.exists('foo')).to.be.true;
    client.del('foo');
    expect(client.exists('foo')).to.be.false;
  });

  it('Keys', () => {
    client.set('foo', 'bar');
    client.set('bar', 'foo');
    expect(client.keys()).to.have.members(['foo', 'bar']);
  });

  it('Clear', () => {
    client.set('foo', 'bar');
    client.set('bar', 'foo');
    client.clear();
    expect(client.keys()).to.be.empty;
  });

  it('List', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    expect(client.list('foo')).to.have.members(['baz', 'foo', 'bar']);
  });

  it('List set', () => {
    client.lpush('foo', 'bar');
    client.lpush('foo', 'foo');
    client.lpush('foo', 'baz');
    client.lset('foo', 1, 'bar');
    expect(client.list('foo')).to.have.members(['baz', 'bar', 'bar']);
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
    expect(client.list('foo')).to.have.members(['baz', 'foo', 'bar']);
    expect(client.lrange('foo', 0, 2)).to.have.members(['foo', 'bar']);
  });
});

describe('In-memory with expiration', () => {
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

  it('Get TTL', async () => {
    client.setex('foo', 'bar', 2);
    expect(client.ttl('foo')).to.be.greaterThanOrEqual(0);
    await sleep(2100);
    expect(client.ttl('foo')).to.equal(-1);
  });

  it('Get TTL in milliseconds', async () => {
    client.setex('foo', 'bar', 2);
    expect(client.ttl('foo', true)).to.be.greaterThanOrEqual(1000);
    await sleep(2100);
    expect(client.ttl('foo', true)).to.equal(-1);
  });
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
