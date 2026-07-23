const assert = require('assert');
const {
  buildMovieDownloadUrl,
  getMoviePreviewStorageKey,
  getStoredMoviePreview,
  storeMoviePreview
} = require('./movieDownloadLinks.js');

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

assert.strictEqual(
  getMoviePreviewStorageKey({ id: 42 }),
  'netchill_movie_preview:42'
);

assert.strictEqual(
  getMoviePreviewStorageKey('Sky Riders'),
  'netchill_movie_preview:sky-riders'
);

const storage = {};
const preview = { title: 'Hero Squad', id: 42 };
assert.strictEqual(storeMoviePreview(preview, preview, storage), true);
assert.deepStrictEqual(getStoredMoviePreview(preview, storage), preview);

console.log('movieDownloadLinks tests passed');
