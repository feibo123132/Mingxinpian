import assert from 'node:assert/strict';
import test from 'node:test';
import { createFixedModeDrawSequence, createFateEightDrawSequence, drawFixedMode, fixedModes } from '../src/lib/fixedModes.ts';
import { getThemeById } from '../src/themes/index.ts';
import { collectCard, consumeCard } from '../src/lib/cardBox.ts';

test('fate eight has one devil in 5-8, one revival in 1-3 and keeps the other three cards', () => {
  const mode = fixedModes.find(mode => mode.id === 'fate-eight');
  assert.ok(mode?.kind === 'sequence');
  assert.equal(mode.name, '命运八抽');
  assert.equal(mode.totalDraws, 8);
  const devilPositions = new Set<number>();
  const revivalPositions = new Set<number>();
  for (let seed = 0; seed < 1000; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const results = createFateEightDrawSequence(random);
    const devilDraws = results.flatMap((result, index) => result === 0 ? [index + 1] : []);
    const revivalDraws = results.flatMap((result, index) => result === 4 ? [index + 1] : []);
    assert.equal(results.length, 8);
    assert.equal(devilDraws.length, 1);
    assert.ok(devilDraws[0] >= 5 && devilDraws[0] <= 8);
    assert.equal(revivalDraws.length, 1);
    assert.ok(revivalDraws[0] >= 1 && revivalDraws[0] <= 3);
    devilPositions.add(devilDraws[0]);
    revivalPositions.add(revivalDraws[0]);
    for (const card of [1, 2, 3]) assert.ok(results.includes(card));
    for (let drawNumber = 1; drawNumber <= 8; drawNumber++) {
      if (!revivalDraws.includes(drawNumber) && !devilDraws.includes(drawNumber)) {
        assert.ok([1, 2, 3].includes(results[drawNumber - 1] ?? -1));
      }
    }
  }
  for (const value of [0, 0.25, 0.5, 0.75, 0.999999]) {
    const results = createFateEightDrawSequence(() => value);
    devilPositions.add(results.indexOf(0) + 1);
    revivalPositions.add(results.indexOf(4) + 1);
  }
  assert.deepEqual([...devilPositions].sort(), [5, 6, 7, 8]);
  assert.deepEqual([...revivalPositions].sort(), [1, 2, 3]);
});

test('a fixed round ends after eight draws', () => {
  const mode = fixedModes[0];
  assert.equal(drawFixedMode(mode, 0), null);
  assert.equal(drawFixedMode(mode, 9), null);
  assert.equal(drawFixedMode(mode, 1.5), null);
});

test('fate four collects each adventure II card exactly once in a shuffled round', () => {
  const mode = fixedModes.find(mode => mode.id === 'fate-four');
  assert.ok(mode?.kind === 'sequence');
  assert.equal(mode.name, '命运四抽');
  assert.equal(mode.themeId, 'adventure-2');
  assert.equal(mode.totalDraws, 4);
  const theme = getThemeById(mode.themeId);
  const orders = new Set<string>();
  for (let seed = 0; seed < 1000; seed++) {
    let state = Math.imul(seed, 2654435761) >>> 0;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const sequence = createFixedModeDrawSequence(mode, random);
    assert.ok(sequence);
    assert.equal(sequence.length, mode.totalDraws);
    assert.deepEqual([...sequence].sort(), [0, 1, 2, 3]);
    orders.add(sequence.join(','));
    const box = sequence.reduce((box, index) => collectCard(box, theme.cards[index].id), {});
    assert.deepEqual(box, { 'adventure-1': 1, 'adventure-2': 1, 'adventure-3': 1, 'adventure-6': 1 });
    assert.deepEqual(consumeCard(box, 'adventure-6'), { 'adventure-1': 1, 'adventure-2': 1, 'adventure-3': 1 });
  }
  assert.equal(orders.size, 24);
  assert.equal(drawFixedMode(mode, 0), null);
  assert.equal(drawFixedMode(mode, 5), null);
  assert.equal(drawFixedMode(mode, 1.5), null);
});

test('the shared fixed sequence builder preserves the fate eight rules', () => {
  const mode = fixedModes.find(mode => mode.id === 'fate-eight');
  assert.ok(mode?.kind === 'sequence');
  assert.deepEqual(createFixedModeDrawSequence(mode, () => 0.5), createFateEightDrawSequence(() => 0.5));
  const theme = getThemeById(mode.themeId);
  const drawnCards = createFixedModeDrawSequence(mode, () => 0.5)!.map(index => theme.cards[index]);
  assert.ok(drawnCards.some(card => card.id === 'adventure-6' && card.title === '连唱卡'));
  assert.ok(!drawnCards.some(card => card.id === 'adventure-4' || card.title === '简单卡'));
});
