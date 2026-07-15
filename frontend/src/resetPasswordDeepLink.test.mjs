import test from 'node:test';
import assert from 'node:assert/strict';
import { getResetTokenFromLocation } from './resetPasswordDeepLink.mjs';

test('reads recovery token from query string', () => {
  const location = new URL('https://example.com/reset-password?access_token=test-token');
  assert.equal(getResetTokenFromLocation(location), 'test-token');
});

test('reads recovery token from hash fragment', () => {
  const location = new URL('https://example.com/reset-password#access_token=hash-token&type=recovery');
  assert.equal(getResetTokenFromLocation(location), 'hash-token');
});

test('returns null when no token is present', () => {
  const location = new URL('https://example.com/reset-password');
  assert.equal(getResetTokenFromLocation(location), null);
});
