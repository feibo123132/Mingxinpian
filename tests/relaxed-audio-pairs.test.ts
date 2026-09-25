import assert from 'node:assert/strict';
import test from 'node:test';
import { getRelaxedAudioPairForDraw, normalizeRelaxedAudioPairs, relaxedPairMusic, relaxedPairSounds } from '../src/lib/relaxedAudioPairs.ts';

const pair = (id: string) => ({ id, sound: relaxedPairSounds[0], music: relaxedPairMusic[2] });

test('saved pairs retain only valid local tracks', () => {
  const valid = pair('good');
  assert.deepEqual(normalizeRelaxedAudioPairs([valid, pair('good'), { ...pair('bad-track'), music: '/audio/missing.mp3' }]), [valid]);
});

test('new numbered pair tracks are allowed, but similar malformed names are rejected', () => {
  const fourthSound = '/audio/relaxed-card-04.mp3';
  const fourthMusic = '/audio/relaxed-card-music4.mp3';
  assert.deepEqual(normalizeRelaxedAudioPairs([
    { id: 'new', sound: fourthSound, music: fourthMusic },
    { id: 'bad', sound: fourthSound, music: '/audio/relaxed-card-music4❌️.mp3' },
  ]), [{ id: 'new', sound: fourthSound, music: fourthMusic }]);
});

test('both cards share one pair order, including pairs saved with old card assignments', () => {
  const pairs = normalizeRelaxedAudioPairs([
    { ...pair('first'), cardId: 'relaxed-2' },
    { ...pair('second'), sound: relaxedPairSounds[2], music: relaxedPairMusic[0], cardId: 'relaxed-1' },
  ]);
  assert.deepEqual(pairs.map(({ id }) => id), ['first', 'second']);
  assert.ok(pairs.every(pair => !('cardId' in pair)));
  assert.equal(getRelaxedAudioPairForDraw(pairs, 0), pairs[0]);
  assert.equal(getRelaxedAudioPairForDraw(pairs, 1), pairs[1]);
  assert.equal(getRelaxedAudioPairForDraw(pairs, 2), pairs[0]);
  assert.equal(getRelaxedAudioPairForDraw([], 0), null);
  assert.equal(getRelaxedAudioPairForDraw(pairs, -1), null);
});
