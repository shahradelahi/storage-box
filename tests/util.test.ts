import { isBase64, ObjectUtil } from '@/index.ts';
import { expect } from 'chai';

describe('Base64', () => {
  it('isBase64', () => {
    expect(isBase64('foo')).to.be.false;
    expect(isBase64('Zm9v')).to.be.true;
  });
});

describe('Object', () => {
  it('removeUndefined', () => {
    const obj = {
      foo: 'bar',
      bar: 'baz',
      baz: undefined
    };
    const result = ObjectUtil.removeUndefined(obj);
    expect(result).to.deep.equal({
      foo: 'bar',
      bar: 'baz'
    });
  });

  it('toMap', () => {
    const obj = {
      foo: 'bar',
      bar: 'baz',
      baz: undefined
    };
    const result = ObjectUtil.toMap(obj);
    expect(result).to.deep.equal(new Map(Object.entries(obj)));
  });

  it('fromMap', () => {
    const obj = {
      foo: 'bar',
      bar: 'baz',
      baz: undefined
    };
    const result = ObjectUtil.fromMap(ObjectUtil.toMap(obj));
    expect(result).to.deep.equal(obj);
  });
});
