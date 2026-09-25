import assert from 'node:assert/strict';
import test from 'node:test';

import { pausePendingCardAudio, resumePendingCardAudio } from '../src/lib/cardAudioControls.ts';

class FakeAudio {
  currentTime = 7;
  pauseCalls = 0;
  playCalls = 0;
  errors = 0;
  shouldReject = false;

  pause() { this.pauseCalls += 1; }
  play() {
    this.playCalls += 1;
    return this.shouldReject ? Promise.reject(new Error('play blocked')) : Promise.resolve();
  }
  dispatchEvent(event: Event) {
    if (event.type === 'error') this.errors += 1;
    return true;
  }
}

test('pause and resume affect only unfinished card tracks without restarting them', () => {
  const voice = new FakeAudio();
  const music = new FakeAudio();
  const finished = new FakeAudio();
  const pending = new Set([voice, music]);

  assert.equal(pausePendingCardAudio(pending), true);
  assert.equal(resumePendingCardAudio(pending), true);
  for (const audio of [voice, music]) {
    assert.equal(audio.pauseCalls, 1);
    assert.equal(audio.playCalls, 1);
    assert.equal(audio.currentTime, 7);
  }
  assert.equal(finished.pauseCalls, 0);
  assert.equal(finished.playCalls, 0);
  assert.equal(pausePendingCardAudio(new Set()), false);
  assert.equal(resumePendingCardAudio(null), false);
});

test('a failed resume reports an audio error to the existing completion handler', async () => {
  const music = new FakeAudio();
  music.shouldReject = true;

  assert.equal(resumePendingCardAudio(new Set([music])), true);
  await Promise.resolve();
  assert.equal(music.errors, 1);
});
