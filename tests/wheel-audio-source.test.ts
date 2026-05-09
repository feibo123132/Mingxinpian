import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const wheelSource = readFileSync(new URL('../src/components/Wheel.tsx', import.meta.url), 'utf8');

test('Wheel plays result audio from the selected card instead of an index-preloaded array', () => {
  assert.match(wheelSource, /playSelectedCardSound\(selectedCard\)/);
  assert.doesNotMatch(wheelSource, /selectionAudiosRef/);
});

test('Wheel does not unlock all result audio files on the first spin', () => {
  assert.doesNotMatch(wheelSource, /audioUnlockedRef/);
  assert.doesNotMatch(wheelSource, /forEach\(\(audio\)/);
});

test('Wheel lets spin audio finish naturally when the result card sound starts', () => {
  assert.match(wheelSource, /finishSpinAudioLoop/);
  assert.match(wheelSource, /spinAudio\.loop = false/);
  assert.match(wheelSource, /spinAudio\.onended = \(\) =>/);
  assert.match(wheelSource, /finishSpinAudioLoop\(\);\s*playSelectedCardSound\(selectedCard\)/s);
  assert.doesNotMatch(
    wheelSource,
    /audioRef\.current\.pause\(\);\s*audioRef\.current\.currentTime = 0;\s*audioRef\.current\.onended = null;\s*endAudioEffect\(\);/
  );
});

test('Wheel tracks spin audio effect state independently from card audio', () => {
  assert.match(wheelSource, /spinAudioActiveRef/);
  assert.match(wheelSource, /markSpinAudioStarted/);
  assert.match(wheelSource, /markSpinAudioEnded/);
});
