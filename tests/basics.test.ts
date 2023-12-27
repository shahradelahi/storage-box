import Client from '@/index.ts';
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
    expect(client.get('foo')).to.be.undefined;
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
