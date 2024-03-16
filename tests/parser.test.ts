import { JsonMap, MSGPack } from '@litehex/storage-box';
import { expect } from 'chai';

const data = {
  foo: 'bar',
  bar: 'baz'
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
    const msgPack = MSGPack.stringify(hashMap);
    expect(isBase64(msgPack)).to.be.true;

    console.log(msgPack);
  });

  it('parse', () => {
    const msgPack = MSGPack.stringify(new Map(Object.entries(data)));
    const hashMap = MSGPack.parse(msgPack);
    expect(hashMap.get('foo')).to.equal('bar');
    expect(hashMap.get('bar')).to.equal('baz');
  });
});
