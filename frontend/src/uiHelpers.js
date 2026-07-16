(function (root) {
  const movieCatalog = [
    { title: 'Hero Squad', category: 'Animation', year: '2024', description: 'A brave squad of heroes protecting the city.', link: './Download.html?movie=hero-squad' },
    { title: 'Sky Riders', category: 'Fantasy', year: '2023', description: 'High-flying adventure through the clouds.', link: './Download.html?movie=sky-riders' },
    { title: 'Ocean Drift', category: 'Family', year: '2022', description: 'A heartfelt journey across the open sea.', link: './Download.html?movie=ocean-drift' },
    { title: 'Neon City', category: 'Action', year: '2023', description: 'A futuristic city filled with danger and style.', link: './Download.html?movie=neon-city' },
    { title: 'Moonlight', category: 'Drama', year: '2022', description: 'A quiet story of hope and second chances.', link: './Download.html?movie=moonlight' },
    { title: 'Pixel Quest', category: 'Sci-fi', year: '2024', description: 'A pixel-powered adventure in a digital world.', link: './Download.html?movie=pixel-quest' },
    { title: 'The Last Horizon', category: 'Adventure', year: '2024', description: 'Explorers chase a legendary sunrise across the world.', link: './Download.html?movie=the-last-horizon' },
    { title: 'Midnight Run', category: 'Thriller', year: '2021', description: 'A tense chase through the city at night.', link: './Download.html?movie=midnight-run' },
  ];

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getStoredUser(storage = root.localStorage) {
    if (!storage || typeof storage.getItem !== 'function') {
      return null;
    }

    const storedUser = storage.getItem('netchill_user') || storage.getItem('user');
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.warn('Unable to parse stored user data.', error);
      return null;
    }
  }

  function hasStoredUser(storage = root.localStorage) {
    return Boolean(getStoredUser(storage));
  }

  function getAuthDestination(storage = root.localStorage) {
    return hasStoredUser(storage) ? './dashboard.html' : './login.html';
  }

  function navigateToAuthDestination(storage = root.localStorage) {
    if (typeof window === 'undefined') {
      return './login.html';
    }

    window.location.href = getAuthDestination(storage);
    return window.location.href;
  }

  function getMovieSuggestions(query, catalog = movieCatalog) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return catalog.slice(0, 6);
    }

    return catalog.filter((item) => {
      const searchableText = [item.title, item.category, item.description, item.year].join(' ');
      return normalizeText(searchableText).includes(normalizedQuery);
    }).slice(0, 8);
  }

  const api = {
    movieCatalog,
    getStoredUser,
    hasStoredUser,
    getAuthDestination,
    navigateToAuthDestination,
    getMovieSuggestions,
  };

  root.NetchillUI = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
