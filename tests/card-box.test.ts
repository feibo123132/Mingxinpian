import assert from 'node:assert/strict';
import test from 'node:test';
import { collectCard, consumeCard } from '../src/lib/cardBox.ts';

test('duplicate draws stack in the box and using a card consumes one copy', () => {
  const first = collectCard({}, 'adventure-5');
  const second = collectCard(first, 'adventure-5');
  const third = collectCard(second, 'adventure-1');
  assert.deepEqual(third, { 'adventure-5': 2, 'adventure-1': 1 });
  assert.deepEqual(consumeCard(third, 'adventure-5'), { 'adventure-5': 1, 'adventure-1': 1 });
  assert.deepEqual(consumeCard(consumeCard(third, 'adventure-1'), 'adventure-1'), { 'adventure-5': 2 });
  assert.deepEqual(first, { 'adventure-5': 1 });
});

test('using a card that is absent never creates a negative count', () => {
  const box = { 'adventure-1': 1 };
  assert.equal(consumeCard(box, 'adventure-5'), box);
});
