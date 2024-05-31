import { expect } from 'chai';

import { Client } from '@/client';
import { HashMap } from '@/hash-map';
import { JsonObject } from '@/typings';

interface CuteUser extends JsonObject {
  first: string;
  last: string;
}

class CuteMap extends HashMap<string, CuteUser> {
  addUser(user: CuteUser) {
    const randId = Math.random().toString(36).slice(2);
    this.set(randId, user);
  }

  initials(): string[] {
    const all = this.getall();
    return Object.values(all).map((u) => `${u.first[0]}${u.last[0]}`);
  }
}

const c = new Client();

describe('HashMap', () => {
  it('Baseless', () => {
    interface Vertex extends JsonObject {
      x: number;
      y: number;
    }

    const hash = c.createHashMap<string, Vertex>();

    expect(hash).to.be.instanceOf(HashMap);
  });

  describe('CuteMap', () => {
    it('get initials', () => {
      const cuties = c.createHashMap('CuteHub', CuteMap);

      cuties.addUser({ first: 'Mary', last: 'Jane' });
      cuties.addUser({ first: 'Peter', last: 'Parker' });

      const initials = cuties.initials();

      expect(initials).to.have.members(['MJ', 'PP']);
    });
  });
});
