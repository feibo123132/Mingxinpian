import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('App layout pins the header to the top and footer to the bottom', () => {
  assert.match(appSource, /className="app-container flex min-h-\[calc\(100vh-2rem\)\] w-full flex-col items-center"/);
  assert.match(appSource, /<header className="relative w-full max-w-md pt-5"/);
  assert.match(appSource, /<main className="flex w-full max-w-sm flex-1 items-center justify-center/);
  assert.match(appSource, /<footer className="w-full pb-8 text-center text-sm"/);
  assert.doesNotMatch(appSource, /justify-center p-4/);
});
