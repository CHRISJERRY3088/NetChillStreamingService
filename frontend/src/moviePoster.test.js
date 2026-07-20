const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMoviePoster } = require('./moviePoster');

test('returns a placeholder image for missing poster paths', () => {
  const poster = resolveMoviePoster('', 'The Last Horizon');
  assert.match(poster, /^data:image\/svg\+xml/);
});

test('preserves full remote poster URLs', () => {
  const poster = resolveMoviePoster('https://cdn.example.com/movie.jpg');
  assert.equal(poster, 'https://cdn.example.com/movie.jpg');
});

test('preserves relative poster paths', () => {
  const poster = resolveMoviePoster('./images/poster.jpg');
  assert.equal(poster, './images/poster.jpg');
});
