import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdventureBonusDrawer, createFateTenBonusSchedule, drawAdventureBonus } from '../src/lib/adventureBonus.ts';

test('fate ten has exactly one relaxed bonus in each half, respecting the cooldown', () => {
  for (let seed = 0; seed < 1000; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const schedule = createFateTenBonusSchedule(random);
    const draws = schedule.flatMap((bonus, draw) => bonus === null ? [] : [draw]);
    assert.equal(draws.length, 2);
    assert.ok(draws[0] >= 1 && draws[0] <= 5);
    assert.ok(draws[1] >= 6 && draws[1] <= 10);
    assert.ok(draws[1] - draws[0] >= 4);
    assert.ok(schedule[draws[0]] === 0 || schedule[draws[0]] === 1);
    assert.ok(schedule[draws[1]] === 0 || schedule[draws[1]] === 1);
  }
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
