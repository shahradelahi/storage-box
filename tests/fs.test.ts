import FsDrive from '@/driver/fs.ts';
import { Client } from '@/index.ts';
import { expect } from 'chai';
import fs from 'fs';
import { resolve } from 'path';

describe('fs-based storage', () => {
  const filePath = resolve(process.cwd(), 'tests', 'test.json');

  using drive = new FsDrive(filePath);
  const client = new Client(drive);

  beforeEach(() => {
    client.clear();
  });

  after(() => {
    fs.unlinkSync(filePath);
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
