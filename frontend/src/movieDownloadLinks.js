function buildMovieDownloadUrl(movieOrSlug, type = 'movie') {
  const fallbackSlug = 'featured-movie';
  const rawValue = typeof movieOrSlug === 'string'
    ? movieOrSlug
    : movieOrSlug?.slug || movieOrSlug?.title || movieOrSlug?.id || fallbackSlug;

  const normalizedSlug = String(rawValue)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const slug = normalizedSlug || fallbackSlug;
  return `./Download.html?id=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
}

if (typeof window !== 'undefined') {
  window.buildMovieDownloadUrl = buildMovieDownloadUrl;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildMovieDownloadUrl };
}
