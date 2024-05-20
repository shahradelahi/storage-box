import { expect } from 'chai';

import { JsonMap } from '@/parser/json-map';
import { MSGPack } from '@/parser/msg-pack';

const data = {
  foo: 'bar',
  bar: 'baz',
};

describe('JSON-MAP', () => {
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

describe('MSGPack-MAP', () => {
  function isBase64(str: string): boolean {
    // Regular expression to check if a string is base64 encoded
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    return base64Regex.test(str);
  }

  it('stringify', () => {
    const hashMap = new Map<string, string>();
    hashMap.set('foo', 'bar');
    hashMap.set('bar', 'baz');
    const b64 = MSGPack.stringify(hashMap);
    expect(isBase64(b64)).to.be.true;
    expect(b64.length, b64).to.be.greaterThan(6);
  });

  it('parse', () => {
    const b64 = MSGPack.stringify(new Map(Object.entries(data)));
    expect(b64.length, b64).to.be.greaterThan(6);

    const hashMap = MSGPack.parse(b64);
    expect(hashMap.get('foo')).to.equal('bar');
    expect(hashMap.get('bar')).to.equal('baz');
  });
});
