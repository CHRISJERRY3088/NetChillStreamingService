const assert = require('assert');
const { buildMovieDownloadUrl } = require('./movieDownloadLinks.js');

assert.strictEqual(
  buildMovieDownloadUrl({ title: 'Hero Squad' }),
  './Download.html?id=hero-squad&type=movie'
);

assert.strictEqual(
  buildMovieDownloadUrl('Sky Riders'),
  './Download.html?id=sky-riders&type=movie'
);

assert.strictEqual(
  buildMovieDownloadUrl({ id: 42 }),
  './Download.html?id=42&type=movie'
);

console.log('movieDownloadLinks tests passed');
