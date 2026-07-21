const test = require('node:test');
const assert = require('node:assert/strict');
const { getAuthDestination, getLogoutDestination, getMovieSuggestions } = require('./uiHelpers');

test('redirects to dashboard when a saved user exists', () => {
  const storage = {
    getItem: (key) => (key === 'netchill_user' ? '{"id":"1"}' : null),
  };

  assert.equal(getAuthDestination(storage), './dashboard.html');
});

test('redirects to login when there is no saved user', () => {
  const storage = {
    getItem: () => null,
  };

  assert.equal(getAuthDestination(storage), './login.html');
});

test('redirects signed-in users to login on logout, and guests to the home page', () => {
  const signedInStorage = {
    getItem: (key) => (key === 'netchill_user' ? '{"id":"1"}' : null),
  };
  const guestStorage = {
    getItem: () => null,
  };
  const invalidStorage = {
    getItem: (key) => (key === 'netchill_user' ? '{}' : null),
  };

  assert.equal(getLogoutDestination(signedInStorage), './login.html');
  assert.equal(getLogoutDestination(guestStorage), './login.html');
  assert.equal(getLogoutDestination(invalidStorage), './login.html');
});

test('returns close movie suggestions for similar names', () => {
  const suggestions = getMovieSuggestions('sky', [
    { title: 'Sky Riders', category: 'Fantasy', description: 'High-flying adventure.', year: '2023' },
    { title: 'Hero Squad', category: 'Animation', description: 'A brave squad.', year: '2024' },
  ]);

  assert.deepEqual(suggestions.map((item) => item.title), ['Sky Riders']);
});
