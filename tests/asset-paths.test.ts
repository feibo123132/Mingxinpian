import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePublicAssetPath, resolveAssetPathForEnvironment } from '../src/lib/assetPaths.ts';

test('normalizes public folder asset references to browser URLs', () => {
  assert.equal(
    normalizePublicAssetPath('public\\images\\themes\\summer\\card-05.png'),
    '/images/themes/summer/card-05.png',
  );
  assert.equal(
    normalizePublicAssetPath('./public/images/themes/summer/start-button.png'),
    '/images/themes/summer/start-button.png',
  );
});

test('resolves public assets from the web root during dev even when base is relative', () => {
  assert.equal(
    resolveAssetPathForEnvironment('/images/themes/summer/card-05.png', {
      baseUrl: './',
      isDev: true,
    }),
    '/images/themes/summer/card-05.png',
  );
});

test('keeps production relative asset URLs when base is relative', () => {
  assert.equal(
    resolveAssetPathForEnvironment('/images/themes/summer/card-05.png', {
      baseUrl: './',
      isDev: false,
    }),
    './images/themes/summer/card-05.png',
  );
});
