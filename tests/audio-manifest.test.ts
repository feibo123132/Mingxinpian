import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildAudioManifest, isAudioFilename } from '../scripts/audioManifest.ts';

test('catalogue accepts exact names across themes and excludes annotated copies', () => {
  for (const name of ['spin.mp3', 'pop.mp3', 'bgm3.mp3', 'summer-bgm1.mp3', 'card5.mp3',
    'card1-music.mp3', 'adventure-angel12-music.mp3', 'adventure-devil-music.mp3',
    'adventure-devil4-music.mp3', 'adventure-card-03-music3.mp3', 'adventure-card-04-music.mp3',
    'relaxed-card-01.mp3', 'relaxed-card-music2.mp3', 'relaxed-card-03-music.mp3',
    'summer-card-10-music12.mp3', 'adventure-completion-voice2.mp3', 'adventure-completion-music3.mp3']) {
    assert.equal(isAudioFilename(name), true, name);
  }
  for (const name of ['spin❌️.mp3', 'adventure-card-03-music3❌️.mp3', 'adventure-angel01-music.mp3',
    'adventure-card-03-music03.mp3', 'relaxed-card-music3 copy.mp3', 'adventure-angel4-music.mp4',
    'other.mp3', 'adventure-card-03-music3.mp3.bak', 'adventure-card-03-music3.MP3']) {
    assert.equal(isAudioFilename(name), false, name);
  }
});

test('manifest revisions change only when file contents change and builds are deterministic', () => {
  const directory = mkdtempSync(join(tmpdir(), 'postcard-manifest-test-'));
  writeFileSync(join(directory, 'spin.mp3'), 'abc');
  writeFileSync(join(directory, 'adventure-angel1-music.mp3'), 'def');
  writeFileSync(join(directory, 'spin❌️.mp3'), 'bad');
  mkdirSync(join(directory, 'bgm1.mp3'));
  const first = buildAudioManifest(directory);
  assert.equal(first.files.length, 2);
  assert.deepEqual(first, buildAudioManifest(directory));
  writeFileSync(join(directory, 'spin.mp3'), 'abcd');
  const next = buildAudioManifest(directory);
  assert.equal(next.files[0].revision, first.files[0].revision);
  assert.notEqual(next.files[1].revision, first.files[1].revision);
  assert.equal(next.files[1].size, 4);
});

test('current deployed audio names can be catalogued without renaming media', () => {
  const manifest = buildAudioManifest(fileURLToPath(new URL('../public/audio', import.meta.url)));
  assert.ok(manifest.files.length > 40);
  assert.ok(manifest.files.some(file => file.path === 'audio/spin.mp3'));
  assert.ok(manifest.files.every(file => !file.path.includes('❌')));
});
