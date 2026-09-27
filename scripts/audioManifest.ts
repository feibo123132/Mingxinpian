import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Exact filenames only: disabled/annotated copies must never enter the catalogue.
const number = '[1-9]\\d*';
const cardNumber = '(?:0[1-9]|[1-9]\\d+)';
const music = `-music(?:${number})?`;
const audioNames = [
  'spin', 'pop', `(?:summer-)?bgm${number}`,
  `card[1-5](?:${music})?`,
  `(?:adventure|summer)-card-${cardNumber}(?:${music})?`,
  `relaxed-card(?:-${cardNumber})?(?:${music})?`,
  `adventure-angel${number}-music`,
  `adventure-devil(?:${number})?-music`,
  `adventure-completion-(?:voice|music)${number}`,
];
const filenamePattern = new RegExp(`^(?:${audioNames.join('|')})\\.mp3$`);
export const isAudioFilename = (name: string) => filenamePattern.test(name);

export const buildAudioManifest = (directory: string) => ({
  version: 1,
  files: readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && isAudioFilename(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map(entry => {
      const bytes = readFileSync(join(directory, entry.name));
      return {
        path: `audio/${entry.name}`,
        revision: createHash('sha256').update(bytes).digest('hex'),
        size: bytes.length,
      };
    }),
});

export const audioManifestPlugin = () => ({
  name: 'local-audio-manifest',
  generateBundle() {
    const manifest = buildAudioManifest(join(process.cwd(), 'public/audio'));
    this.emitFile({
      type: 'asset',
      fileName: 'audio-manifest.js',
      source: `self.AUDIO_MANIFEST = ${JSON.stringify(manifest)};\n`,
    });
  },
});
