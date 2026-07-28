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

  function setDropdownBackdrop(open) {
    const backdrop = typeof document !== 'undefined' ? document.getElementById('dropdownBlurBackdrop') : null;
    if (!backdrop) return;
    backdrop.classList.toggle('show', Boolean(open));
  }

  function syncDropdownBackdrop() {
    const dropdowns = typeof document !== 'undefined'
      ? Array.from(document.querySelectorAll('[id$="SearchDropdown"], [id$="MovieSearchDropdown"], #sectionSidebarSearchDropdown'))
      : [];
    const isOpen = dropdowns.some((dropdownEl) => dropdownEl && !dropdownEl.classList.contains('hidden'));
    setDropdownBackdrop(isOpen);
  }

  function hideAllSearchDropdowns() {
    const dropdowns = typeof document !== 'undefined'
      ? Array.from(document.querySelectorAll('[id$="SearchDropdown"], [id$="MovieSearchDropdown"], #sectionSidebarSearchDropdown'))
      : [];
    dropdowns.forEach((dropdownEl) => dropdownEl.classList.add('hidden'));
    syncDropdownBackdrop();
  }

  function ensureDropdownBackdropHandlers() {
    if (typeof document === 'undefined' || document.__netchillDropdownBackdropBound) return;
    const backdrop = document.getElementById('dropdownBlurBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', hideAllSearchDropdowns);
    }
    document.addEventListener('click', (event) => {
      const clickedInsideDropdown = event.target.closest('[id$="SearchDropdown"], [id$="MovieSearchDropdown"], #sectionSidebarSearchDropdown, .search-shell');
      if (!clickedInsideDropdown) {
        hideAllSearchDropdowns();
      }
    });
    document.__netchillDropdownBackdropBound = true;
  }

  function showMovieSuggestions(inputEl, dropdownEl, query, catalog = movieCatalog) {
    if (!inputEl || !dropdownEl) return null;

    const suggestions = getMovieSuggestions(query, catalog);
    if (!query || !String(query).trim() || suggestions.length === 0) {
      dropdownEl.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">No matching movies found.</div>';
      dropdownEl.classList.remove('hidden');
      syncDropdownBackdrop();
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
    syncDropdownBackdrop();
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

    ensureDropdownBackdropHandlers();

    // Utility: position dropdown beneath the input within its parent container and show an arrow
    function positionDropdown() {
      if (!inputEl || !dropdownEl) return;

      const rect = inputEl.getBoundingClientRect();
      const parentEl = dropdownEl.parentElement || document.body;
      const parentRect = parentEl.getBoundingClientRect();
      const viewW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const preferredWidth = 300;
      const dropdownWidth = Math.min(preferredWidth, Math.max(200, viewW - 32));

      dropdownEl.style.position = 'absolute';
      dropdownEl.style.width = dropdownWidth + 'px';
      dropdownEl.style.transform = 'none';

      const isBodyParent = parentEl === document.body;
      const parentWidth = Math.max(240, isBodyParent ? viewW : Math.round(parentEl.clientWidth || parentRect.width || viewW));
      const parentLeft = isBodyParent ? window.scrollX : parentRect.left;
      const parentTop = isBodyParent ? window.scrollY : parentRect.top;

      const left = Math.round(rect.left - parentLeft + (rect.width / 2) - (dropdownWidth / 2));
      const top = Math.round(rect.bottom - parentTop + 2);

      const clampedLeft = Math.max(8, Math.min(left, parentWidth - dropdownWidth - 8));
      dropdownEl.style.left = clampedLeft + 'px';
      dropdownEl.style.top = top + 'px';
      dropdownEl.style.transform = 'none !important';
      dropdownEl.style.zIndex = 9999;

      // Create or update arrow pointing to the input center
      try {
        let arrow = dropdownEl.querySelector('.netchill-dropdown-arrow');
        if (!arrow) {
          arrow = document.createElement('div');
          arrow.className = 'netchill-dropdown-arrow';
          arrow.style.position = 'absolute';
          arrow.style.top = '-8px';
          arrow.style.width = '0px';
          arrow.style.height = '0px';
          arrow.style.pointerEvents = 'none';
          arrow.innerHTML = '<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid rgba(15,23,42,0.9);"></div>';
          dropdownEl.appendChild(arrow);
        }

        const arrowWidth = 16; // px
        const inputCenterX = Math.round(rect.left - parentLeft + rect.width / 2);
        const arrowLeft = inputCenterX - clampedLeft - Math.round(arrowWidth / 2);
        const arrowClamped = Math.max(8, Math.min(arrowLeft, dropdownWidth - arrowWidth - 8));
        arrow.style.left = arrowClamped + 'px';
      } catch (e) {
        // ignore arrow positioning errors
      }
    }

    // Debounced reposition helper
    let repositionRaf = null;
    function scheduleReposition() {
      if (repositionRaf) cancelAnimationFrame(repositionRaf);
      repositionRaf = requestAnimationFrame(() => {
        positionDropdown();
        repositionRaf = null;
      });
    }

    // Show/update suggestions and position the dropdown
    function showAndPosition() {
      showMovieSuggestions(inputEl, dropdownEl, inputEl.value, catalog);
      scheduleReposition();
    }

    inputEl.addEventListener('input', (event) => {
      showAndPosition();
    });

    inputEl.addEventListener('focus', () => {
      showAndPosition();
    });

    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        dropdownEl.classList.add('hidden');
        syncDropdownBackdrop();
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        dropdownEl.classList.add('hidden');
        syncDropdownBackdrop();
        // cleanup handlers when hidden
        if (dropdownEl._netchillCleanup) dropdownEl._netchillCleanup();
      }, 180);
    });

    dropdownEl.addEventListener('click', (event) => {
      const buttonEl = event.target.closest('button[data-link]');
      if (!buttonEl) return;

      inputEl.value = buttonEl.dataset.title || inputEl.value;
      dropdownEl.classList.add('hidden');
      syncDropdownBackdrop();
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = buttonEl.dataset.link;
      }
    });

    // Reposition on scroll/resize to keep aligned with input
    function onWindowChange() {
      scheduleReposition();
    }

    window.addEventListener('resize', onWindowChange, { passive: true });
    window.addEventListener('scroll', onWindowChange, { passive: true });

    // Provide cleanup to remove handlers and arrow when dropdown is removed
    dropdownEl._netchillCleanup = () => {
      try {
        window.removeEventListener('resize', onWindowChange);
        window.removeEventListener('scroll', onWindowChange);
        if (repositionRaf) cancelAnimationFrame(repositionRaf);
        const arrow = dropdownEl.querySelector('.netchill-dropdown-arrow');
        if (arrow) arrow.remove();
      } catch (e) {
        // ignore cleanup errors
      }
    };

    // Store a reference for potential external repositioning
    dropdownEl._netchillPositionHandlers = { scheduleReposition, positionDropdown };

    return { inputEl, dropdownEl, positionDropdown };
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
      style.innerHTML = '[id$="SearchDropdown"]{ width:700px !important; height:600px !important; max-height:none !important; overflow:auto !important; position:absolute !important; }\n@media (max-width:1280px){ [id$="SearchDropdown"]{ width:300px !important; max-width:calc(100vw - 2rem) !important; max-height:60vh !important; } }\n@media (max-width:768px){ [id$="SearchDropdown"]{ width:300px !important; max-width:calc(100vw - 2rem) !important; max-height:60vh !important; } }\n@media (max-width:640px){ [id$="SearchDropdown"]{ width:300px !important; max-width:calc(100vw - 1rem) !important; max-height:55vh !important; } }';
      document.head.appendChild(style);
    }
  } catch (e) {
    // ignore in non-browser environments
  }
})(typeof window !== 'undefined' ? window : globalThis);
