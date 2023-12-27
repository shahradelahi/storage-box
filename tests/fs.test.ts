import FsDrive from '@/driver/fs.ts';
import { Client } from '@/index.ts';
import { expect } from 'chai';
import fs from 'fs';

describe('fs-based storage', () => {
  using drive = new FsDrive('./tests/test.json');
  const client = new Client(drive);

  beforeEach(() => {
    client.clear();
  });

  after(() => {
    fs.unlinkSync('./tests/test.json');
  });

  it('Set and get', () => {
    client.set('foo', 'bar');
    client.set('bar', 'baz');
    expect(client.get('foo')).to.equal('bar');
  });

  it('Delete', () => {
    client.set('foo', 'bar');
    client.del('foo');
    expect(client.get('foo')).to.be.undefined;
  });
});
