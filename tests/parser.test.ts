import { JsonMap } from '@/parser';
import { expect } from 'chai';

describe('JSON-MAP', () => {
  const data = {
    foo: 'bar',
    bar: 'baz'
  };

  it('stringify', () => {
    const hashMap = new Map<string, string>();
    hashMap.set('foo', 'bar');
    hashMap.set('bar', 'baz');
    const json = JsonMap.stringify(hashMap);
    expect(json).to.equal(JSON.stringify(data));
  });

  it('parse', () => {
    const hashMap = JsonMap.parse(JSON.stringify(data));
    expect(hashMap.get('foo')).to.equal('bar');
  });
});
