import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const wheelSource = readFileSync(new URL('../src/components/Wheel.tsx', import.meta.url), 'utf8');

test('ResultModal spin-again action requests another wheel spin from App', () => {
  assert.match(appSource, /const \[spinRequestId, setSpinRequestId\] = useState\(0\)/);
  assert.match(appSource, /setSpinRequestId\(\(requestId\) => requestId \+ 1\)/);
  assert.match(appSource, /<Wheel[\s\S]+spinRequestId=\{spinRequestId\}/);
});

test('Wheel responds to spin-again requests after the initial render', () => {
  assert.match(wheelSource, /spinRequestId\?: number/);
  assert.match(wheelSource, /lastHandledSpinRequestRef/);
  assert.match(wheelSource, /if \(spinRequestId === lastHandledSpinRequestRef\.current\) return/);
  assert.match(wheelSource, /spin\(\)/);
});
