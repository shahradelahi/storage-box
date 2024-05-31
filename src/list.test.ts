import { expect } from 'chai';

import { Client } from '@/client';
import { List } from '@/list';
import { sleep } from '@/tests/utils';

const c = new Client();

class LuckyNumberList extends List<number> {
  median(): number {
    const numbers = this.toArray();

    numbers.sort((a, b) => a - b);

    return numbers[Math.floor(numbers.length / 2)] || 0;
  }
}

describe('List', () => {
  it('Baseless', () => {
    const list = c.createList();
    expect(list).to.be.instanceOf(List);

    list.push(1);
    list.push(2);
    list.push(3);

    expect(list.toArray()).to.have.members([1, 2, 3]);
  });

  it('Iteration', () => {
    const list = c.createList();
    list.push(1);
    list.push(2);
    list.push(3);

    for (const item of list) {
      expect(item).to.be.oneOf([1, 2, 3]);
    }
  });

  describe('Lucky Numbers', () => {
    const list = c.createList(LuckyNumberList);

    it('get median', () => {
      list.push(1);
      list.push(2);
      list.push(3);

      const median = list.median();
      expect(median).to.equal(2);
    });
  });

  describe('Time-based', () => {
    it('pushex', async () => {
      const list = c.createList();
      list.pushex(1, 1);
      list.pushex(2, 1);
      list.pushex(3, 1);

      expect(list.toArray()).to.have.length(3);
      expect(list.toArray()).to.have.members([1, 2, 3]);

      await sleep(1000);

      expect(list.toArray()).to.have.length(3);
      expect(list.toArray()).to.have.members([null, null, null]);
    });
  });
});
