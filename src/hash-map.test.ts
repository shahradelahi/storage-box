import { expect } from 'chai';

import { Client } from '@/client';
import { HashMap } from '@/hash-map';
import { JsonObject } from '@/typings';

interface CuteUser extends JsonObject {
  first: string;
  last: string;
}

class CuteMap extends HashMap<string, CuteUser> {
  async addUser(user: CuteUser) {
    const randId = Math.random().toString(36).slice(2);
    await this.set(randId, user);
  }

  async initials(): Promise<string[]> {
    const all = await this.getall();
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
    it('get initials', async () => {
      const cuties = c.createHashMap('CuteHub', CuteMap);

      await cuties.addUser({ first: 'Mary', last: 'Jane' });
      await cuties.addUser({ first: 'Peter', last: 'Parker' });

      const initials = await cuties.initials();

      expect(initials).to.have.members(['MJ', 'PP']);
    });
  });
});
