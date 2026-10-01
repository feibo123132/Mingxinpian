import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdventureBonusDrawer, createFixedModeBonusSchedule, createFateEightBonusSchedule, drawAdventureBonus } from '../src/lib/adventureBonus.ts';

test('fate four has exactly one extra relaxed bonus at a random draw each round', () => {
  const positions = new Set<number>();
  const cards = new Set<number>();
  for (let seed = 0; seed < 1000; seed++) {
    let state = Math.imul(seed, 2654435761) >>> 0;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const schedule = createFixedModeBonusSchedule('fate-four', random);
    assert.ok(schedule);
    assert.equal(schedule.length, 5);
    assert.equal(schedule[0], null);
    const draws = schedule.flatMap((bonus, draw) => bonus === null ? [] : [draw]);
    assert.equal(draws.length, 1);
    assert.ok(draws[0] >= 1 && draws[0] <= 4);
    const bonus = schedule[draws[0]];
    assert.ok(bonus === 0 || bonus === 1);
    positions.add(draws[0]);
    cards.add(bonus);
  }
  assert.deepEqual([...positions].sort(), [1, 2, 3, 4]);
  assert.equal(cards.size, 2);
});

test('fixed bonus scheduling uses fate eight and keeps ordinary mode random', () => {
  assert.deepEqual(createFixedModeBonusSchedule('fate-eight', () => 0.5), createFateEightBonusSchedule(() => 0.5));
  assert.equal(createFixedModeBonusSchedule(undefined), null);
});

test('fate eight has exactly one relaxed bonus in draws 3-6', () => {
  const positions = new Set<number>();
  const cards = new Set<number>();
  for (let seed = 0; seed < 1000; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const schedule = createFateEightBonusSchedule(random);
    const draws = schedule.flatMap((bonus, draw) => bonus === null ? [] : [draw]);
    assert.equal(schedule.length, 9);
    assert.equal(draws.length, 1);
    assert.ok(draws[0] >= 3 && draws[0] <= 6);
    assert.ok(schedule[draws[0]] === 0 || schedule[draws[0]] === 1);
    positions.add(draws[0]);
    cards.add(schedule[draws[0]]);
  }
  for (const value of [0, 0.25, 0.5, 0.75, 0.999999]) {
    positions.add(createFateEightBonusSchedule(() => value).findIndex(bonus => bonus !== null));
  }
  assert.deepEqual([...positions].sort(), [3, 4, 5, 6]);
  assert.equal(cards.size, 2);
});

test('half of the random range triggers a bonus, equally split between two cards', () => {
  const counts = [0, 0, 0];
  for (let i = 0; i < 10000; i++) {
    const result = drawAdventureBonus((i + 0.5) / 10000);
    counts[result === null ? 2 : result]++;
  }
  assert.deepEqual(counts, [2500, 2500, 5000]);
});
test('bonus boundaries exclude the normal singing card', () => {
  assert.equal(drawAdventureBonus(0), 0);
  assert.equal(drawAdventureBonus(0.25), 1);
  assert.equal(drawAdventureBonus(0.5), null);
  assert.equal(drawAdventureBonus(0.999999), null);
});
test('a triggered bonus blocks the next three draws, then becomes available again', () => {
  const drawer = createAdventureBonusDrawer();
  assert.equal(drawer(0.1), 0); // triggers the devil bonus
  assert.equal(drawer(0), null); // cooldown draw 1
  assert.equal(drawer(0), null); // cooldown draw 2
  assert.equal(drawer(0), null); // cooldown draw 3
  assert.equal(drawer(0.3), 1); // available again and triggers the angel bonus
});
test('cooldown only starts after an actual trigger', () => {
  const drawer = createAdventureBonusDrawer();
  assert.equal(drawer(0.9), null); // no trigger, no cooldown
  assert.equal(drawer(0.1), 0); // triggers on the very next draw
});
test('the angel bonus enforces the same cooldown', () => {
  const drawer = createAdventureBonusDrawer();
  assert.equal(drawer(0.25), 1); // triggers the angel bonus
  assert.equal(drawer(0.1), null); // cooldown draw 1
  assert.equal(drawer(0.1), null); // cooldown draw 2
  assert.equal(drawer(0.1), null); // cooldown draw 3
  assert.equal(drawer(0.1), 0); // available again
});
