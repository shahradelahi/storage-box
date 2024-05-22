import { expect } from 'chai';

import { Client } from '@/client';
import { List } from '@/list';
import { sleep } from '@/tests/utils';

const c = new Client();

class LuckyNumberList extends List<number> {
  async median(): Promise<number> {
    const numbers = await this.toArray();

    numbers.sort((a, b) => a - b);

    return numbers[Math.floor(numbers.length / 2)] || 0;
  }
}

describe('List', () => {
  it('Baseless', async () => {
    const list = c.createList();
    expect(list).to.be.instanceOf(List);

    await list.push(1);
    await list.push(2);
    await list.push(3);

    expect(await list.toArray()).to.have.members([1, 2, 3]);
  });

  it('Async iteration', async () => {
    const list = c.createList();
    await list.push(1);
    await list.push(2);
    await list.push(3);

    for await (const item of list) {
      expect(item).to.be.oneOf([1, 2, 3]);
    }
  });

  describe('Lucky Numbers', () => {
    const list = c.createList(LuckyNumberList);

    it('get median', async () => {
      await list.push(1);
      await list.push(2);
      await list.push(3);

      const median = await list.median();
      expect(median).to.equal(2);
    });
  });

  describe('Time-based', () => {
    it('pushex', async () => {
      const list = c.createList();
      await list.pushex(1, 1);
      await list.pushex(2, 1);
      await list.pushex(3, 1);

      expect(await list.toArray()).to.have.length(3);
      expect(await list.toArray()).to.have.members([1, 2, 3]);

      await sleep(1000);

      expect(await list.toArray()).to.have.length(3);
      expect(await list.toArray()).to.have.members([null, null, null]);
    });
  });
});
