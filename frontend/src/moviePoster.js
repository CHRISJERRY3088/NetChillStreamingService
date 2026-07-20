(function (root) {
  function createPlaceholderPoster(title = 'Movie') {
    const safeTitle = String(title || 'Movie').trim().replace(/\s+/g, ' ').slice(0, 28) || 'Movie';
    const initials = safeTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase() || 'MV';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
        <rect width="800" height="1200" fill="#020617" />
        <rect x="24" y="24" width="752" height="1152" rx="36" fill="url(#grad)" stroke="rgba(255,255,255,0.20)" />
        <circle cx="400" cy="430" r="180" fill="rgba(255,255,255,0.08)" />
        <text x="400" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#f8fafc">${initials}</text>
        <text x="400" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#cbd5e1">${safeTitle}</text>
        <text x="400" y="1070" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#64748b">NetChill • Now Streaming</text>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function resolveMoviePoster(posterPath, fallbackTitle = '') {
    if (!posterPath || typeof posterPath !== 'string') {
      return createPlaceholderPoster(fallbackTitle);
    }

    const normalized = posterPath.trim();
    if (!normalized) {
      return createPlaceholderPoster(fallbackTitle);
    }

    if (/assets\//i.test(normalized)) {
      return createPlaceholderPoster(fallbackTitle);
    }

    if (/^https?:\/\//i.test(normalized) || /^\/\//.test(normalized)) {
      return normalized;
    }

    if (/^[./]/.test(normalized)) {
      return normalized;
    }

    return normalized;
  }

  const api = { createPlaceholderPoster, resolveMoviePoster };
  root.NetChillMovieContent = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
