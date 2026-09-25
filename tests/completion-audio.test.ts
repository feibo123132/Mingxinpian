import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completionMusicCandidates,
  completionVoiceCandidates,
  createCompletionAudioPicker,
} from '../src/lib/availableCardMusic.ts';

test('completion voice and music each play both tracks once per cycle', async () => {
  const available = new Set([...completionVoiceCandidates, ...completionMusicCandidates]);
  const pick = createCompletionAudioPicker(async src => available.has(src), () => 0);
  const played = await Promise.all(Array.from({ length: 4 }, () => pick()));

  for (let index = 0; index < played.length; index += 2) {
    assert.deepEqual(played.slice(index, index + 2).map(item => item.voice).sort(), [...completionVoiceCandidates].sort());
    assert.deepEqual(played.slice(index, index + 2).map(item => item.music).sort(), [...completionMusicCandidates].sort());
  }
});

test('completion audio skips files that have not been added yet', async () => {
  const available = new Set([completionVoiceCandidates[1], completionMusicCandidates[0]]);
  const pick = createCompletionAudioPicker(async src => available.has(src), () => 0);

  assert.deepEqual(await pick(), { voice: completionVoiceCandidates[1], music: completionMusicCandidates[0] });
  available.clear();
  assert.deepEqual(await pick(), { voice: null, music: null });
  available.add(completionVoiceCandidates[0]);
  available.add(completionMusicCandidates[1]);
  assert.deepEqual(await pick(), { voice: completionVoiceCandidates[0], music: completionMusicCandidates[1] });
});
