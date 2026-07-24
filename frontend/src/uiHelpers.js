(function (root) {
  const movieCatalog = [
    { title: 'Hero Squad', category: 'Animation', year: '2024', description: 'A brave squad of heroes protecting the city.', link: './Download.html?id=hero-squad&type=movie' },
    { title: 'Sky Riders', category: 'Fantasy', year: '2023', description: 'High-flying adventure through the clouds.', link: './Download.html?id=sky-riders&type=movie' },
    { title: 'Ocean Drift', category: 'Family', year: '2022', description: 'A heartfelt journey across the open sea.', link: './Download.html?id=ocean-drift&type=movie' },
    { title: 'Neon City', category: 'Action', year: '2023', description: 'A futuristic city filled with danger and style.', link: './Download.html?id=neon-city&type=movie' },
    { title: 'Moonlight', category: 'Drama', year: '2022', description: 'A quiet story of hope and second chances.', link: './Download.html?id=moonlight&type=movie' },
    { title: 'Pixel Quest', category: 'Sci-fi', year: '2024', description: 'A pixel-powered adventure in a digital world.', link: './Download.html?id=pixel-quest&type=movie' },
    { title: 'The Last Horizon', category: 'Adventure', year: '2024', description: 'Explorers chase a legendary sunrise across the world.', link: './Download.html?id=the-last-horizon&type=movie' },
    { title: 'Midnight Run', category: 'Thriller', year: '2021', description: 'A tense chase through the city at night.', link: './Download.html?id=midnight-run&type=movie' },
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

  function isAccountLikeUser(user) {
    if (!user || typeof user !== 'object') return false;
    return Boolean(user.id || user.email || user.user?.id || user.user?.email || user.user_metadata?.email || user.metadata?.email);
  }

  function hasStoredUser(storage = root.localStorage) {
    const user = getStoredUser(storage);
    return isAccountLikeUser(user);
  }

  function getAuthDestination(storage = root.localStorage) {
    return hasStoredUser(storage) ? './dashboard.html' : './login.html';
  }

  function getLogoutDestination(storage = root.localStorage) {
    return './login.html';
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

  function showMovieSuggestions(inputEl, dropdownEl, query, catalog = movieCatalog) {
    if (!inputEl || !dropdownEl) return null;

    const suggestions = getMovieSuggestions(query, catalog);
    if (!query || !String(query).trim() || suggestions.length === 0) {
      dropdownEl.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">No matching movies found.</div>';
      dropdownEl.classList.remove('hidden');
      return suggestions;
    }

    dropdownEl.innerHTML = suggestions.map((item) => `
      <button type="button" class="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-gray-100 transition hover:bg-blue-500/20" data-title="${item.title}" data-link="${item.link}">
        <span>
          <span class="block font-semibold text-white">${item.title}</span>
          <span class="mt-1 block text-xs text-gray-400">${item.category} • ${item.year}</span>
        </span>
        <span class="text-xs text-blue-300">Open</span>
      </button>
    `).join('');
    dropdownEl.classList.remove('hidden');
    return suggestions;
  }

  function attachMovieSearch(inputElOrId, dropdownElOrId, catalog = movieCatalog) {
    const inputEl = typeof inputElOrId === 'string'
      ? (typeof document !== 'undefined' ? document.getElementById(inputElOrId) : null)
      : inputElOrId;
    const dropdownEl = typeof dropdownElOrId === 'string'
      ? (typeof document !== 'undefined' ? document.getElementById(dropdownElOrId) : null)
      : dropdownElOrId;

    if (!inputEl || !dropdownEl) return null;

    inputEl.addEventListener('input', (event) => {
      showMovieSuggestions(inputEl, dropdownEl, event.target.value, catalog);
    });

    inputEl.addEventListener('focus', () => {
      showMovieSuggestions(inputEl, dropdownEl, inputEl.value, catalog);
    });

    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        dropdownEl.classList.add('hidden');
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        dropdownEl.classList.add('hidden');
      }, 180);
    });

    dropdownEl.addEventListener('click', (event) => {
      const buttonEl = event.target.closest('button[data-link]');
      if (!buttonEl) return;

      inputEl.value = buttonEl.dataset.title || inputEl.value;
      dropdownEl.classList.add('hidden');
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = buttonEl.dataset.link;
      }
    });

    return { inputEl, dropdownEl };
  }

  const api = {
    movieCatalog,
    getStoredUser,
    hasStoredUser,
    getAuthDestination,
    getLogoutDestination,
    navigateToAuthDestination,
    getMovieSuggestions,
    showMovieSuggestions,
    attachMovieSearch,
  };

  root.NetchillUI = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // Inject global styles for movie search dropdowns (applies to elements with ids ending in "SearchDropdown").
  try {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = '[id$="SearchDropdown"]{ width:700px !important; height:600px !important; max-height:none !important; overflow:auto !important; }\n@media (max-width:640px){ [id$="SearchDropdown"]{ width:calc(100% - 2rem) !important; left:0 !important; transform:none !important; max-height:60vh !important; } }';
      document.head.appendChild(style);
    }
  } catch (e) {
    // ignore in non-browser environments
  }
})(typeof window !== 'undefined' ? window : globalThis);
