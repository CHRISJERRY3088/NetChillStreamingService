function normalizeMovieDownloadId(movieOrSlug, fallbackSlug = 'featured-movie') {
  const rawValue = typeof movieOrSlug === 'string'
    ? movieOrSlug
    : movieOrSlug?.slug || movieOrSlug?.title || movieOrSlug?.id || movieOrSlug?.movieId || movieOrSlug?.name || fallbackSlug;

  const normalizedSlug = String(rawValue ?? fallbackSlug)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return normalizedSlug || fallbackSlug;
}

function buildMovieDownloadUrl(movieOrSlug, type = 'movie') {
  const slug = normalizeMovieDownloadId(movieOrSlug, 'featured-movie');
  return `./Download.html?id=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
}

function getMoviePreviewStorageKey(movieOrSlug, fallbackSlug = 'featured-movie') {
  return `netchill_movie_preview:${normalizeMovieDownloadId(movieOrSlug, fallbackSlug)}`;
}

function getMoviePreviewStorageAdapter(storage = null) {
  if (storage && typeof storage.setItem === 'function' && typeof storage.getItem === 'function' && typeof storage.removeItem === 'function') {
    return storage;
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }

  if (!storage) {
    return null;
  }

  return {
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    getItem: (key) => (Object.prototype.hasOwnProperty.call(storage, key) ? String(storage[key]) : null),
    removeItem: (key) => {
      delete storage[key];
    }
  };
}

function storeMoviePreview(preview, movieOrSlug, storage = null) {
  if (!preview) return false;

  const activeStorage = getMoviePreviewStorageAdapter(storage);
  if (!activeStorage) return false;

  const previewPayload = JSON.stringify(preview);
  const previewKey = getMoviePreviewStorageKey(movieOrSlug || preview?.id || preview?.slug || preview?.title || 'featured-movie');

  try {
    activeStorage.setItem(previewKey, previewPayload);
    activeStorage.setItem('netchill_movie_preview', previewPayload);
    return true;
  } catch (error) {
    console.warn('Unable to save movie preview data', error);
    return false;
  }
}

function getStoredMoviePreview(movieOrSlug, storage = null) {
  const activeStorage = getMoviePreviewStorageAdapter(storage);
  if (!activeStorage) return null;

  const previewKey = getMoviePreviewStorageKey(movieOrSlug || 'featured-movie');

  try {
    const specificPreview = activeStorage.getItem(previewKey);
    if (specificPreview) {
      return JSON.parse(specificPreview);
    }
  } catch (error) {
    console.warn('Unable to read movie preview data', error);
  }

  try {
    const genericPreview = activeStorage.getItem('netchill_movie_preview');
    return genericPreview ? JSON.parse(genericPreview) : null;
  } catch (error) {
    console.warn('Unable to parse movie preview data', error);
    return null;
  }
}

function clearStoredMoviePreview(movieOrSlug, storage = null) {
  const activeStorage = getMoviePreviewStorageAdapter(storage);
  if (!activeStorage) return false;

  const previewKey = getMoviePreviewStorageKey(movieOrSlug || 'featured-movie');

  try {
    activeStorage.removeItem(previewKey);
    activeStorage.removeItem('netchill_movie_preview');
    return true;
  } catch (error) {
    console.warn('Unable to clear movie preview data', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.buildMovieDownloadUrl = buildMovieDownloadUrl;
  window.getMoviePreviewStorageKey = getMoviePreviewStorageKey;
  window.storeMoviePreview = storeMoviePreview;
  window.getStoredMoviePreview = getStoredMoviePreview;
  window.clearStoredMoviePreview = clearStoredMoviePreview;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildMovieDownloadUrl,
    normalizeMovieDownloadId,
    getMoviePreviewStorageKey,
    storeMoviePreview,
    getStoredMoviePreview,
    clearStoredMoviePreview
  };
}
