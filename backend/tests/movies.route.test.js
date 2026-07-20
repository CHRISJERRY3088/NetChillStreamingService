import test from 'node:test';
import assert from 'node:assert/strict';
import { getFallbackMovieResults } from '../route/movies.route.js';

test('fallback results honor genre-based section queries', () => {
  const animationResults = getFallbackMovieResults('animation', 1);
  const horrorResults = getFallbackMovieResults('horror', 1);
  const comedyResults = getFallbackMovieResults('comedy', 1);

  assert.ok(animationResults.some((movie) => (movie?.genres || []).some((genre) => String(genre?.name || '').toLowerCase().includes('animation'))), 'Animation queries should return animation-tagged movies');
  assert.ok(horrorResults.some((movie) => (movie?.genres || []).some((genre) => String(genre?.name || '').toLowerCase().includes('horror'))), 'Horror queries should return horror-tagged movies');
  assert.ok(comedyResults.some((movie) => (movie?.genres || []).some((genre) => String(genre?.name || '').toLowerCase().includes('comedy'))), 'Comedy queries should return comedy-tagged movies');
});
