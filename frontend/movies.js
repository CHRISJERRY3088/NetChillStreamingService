// Movies Page Controller - Loads movies and streaming availability through the backend API
// This script handles trending, popular, and search functionality

const MOVIES = {
  trending: [],
  popular: [],
  search: [],
  selectedMovie: null,
  fallbackMovies: [
    { id: 'fallback-midnight-city', title: 'Midnight City', overview: 'A neon-lit chase through a city that never sleeps.', poster_path: '', vote_average: 8.6, release_date: '2024-01-12' },
    { id: 'fallback-sunfire', title: 'Sunfire', overview: 'An ambitious heist turns into a battle for survival.', poster_path: '', vote_average: 8.2, release_date: '2023-11-24' },
    { id: 'fallback-victory-peak', title: 'Victory Peak', overview: 'A determined crew reaches for glory on the world stage.', poster_path: '', vote_average: 8.4, release_date: '2024-04-18' },
    { id: 'fallback-starlight', title: 'Starlight', overview: 'A heartfelt story about finding home in unexpected places.', poster_path: '', vote_average: 7.9, release_date: '2022-09-03' },
    { id: 'fallback-echo-ride', title: 'Echo Ride', overview: 'An emotional road trip packed with twists and heart.', poster_path: '', vote_average: 8.1, release_date: '2023-07-01' },
    { id: 'fallback-shadow-reef', title: 'Shadow Reef', overview: 'A mysterious island hides secrets beyond imagination.', poster_path: '', vote_average: 7.8, release_date: '2024-02-09' }
  ],

  // Generate poster URL for the movie card and preserve full or relative image paths
  getPosterUrl: (posterPath) => {
    if (!posterPath) return '';
    if (typeof posterPath !== 'string') return '';
    const normalized = posterPath.trim();
    // Prefer absolute URLs
    if (/^https?:\/\//i.test(normalized)) return normalized;
    // Allow protocol-relative URLs
    if (/^\/\//.test(normalized)) return window.location.protocol + normalized;
    // If it's a relative path but not the legacy local ad, return as-is
    if (normalized && !normalized.includes('assets/ad.jpg')) return normalized;
    return '';
  },

  // Format genres
  getGenreText: (genreIds, genreList) => {
    if (!genreIds || genreIds.length === 0) return 'Movie';
    return genreIds.slice(0, 2).map(id => {
      const genre = genreList.find(g => g.id === id);
      return genre ? genre.name : '';
    }).filter(Boolean).join(' • ');
  },

  // Create movie card HTML
  createMovieCard: (movie, index = 0) => {
    const normalizedMovie = MOVIES.normalizeMovie(movie);
    const { id, title, poster_path, vote_average, release_date, overview } = normalizedMovie;
    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    const rating = vote_average ? Number(vote_average).toFixed(1) : 'N/A';
    const movieJson = JSON.stringify(normalizedMovie).replace(/</g, '\u003c');
    const movieIdForJs = JSON.stringify(id);
    
    return `
      <article class="animation-card group rounded-2xl p-2.5 cursor-pointer" data-movie-id="${id}" onclick='MOVIES.goToDownload(${movieIdForJs}, "movie", ${movieJson})'>
        <div class="animation-card__thumb mb-3 rounded-xl relative overflow-hidden bg-gray-800">
          ${MOVIES.getPosterUrl(poster_path) ? `
            <img src="${MOVIES.getPosterUrl(poster_path)}" 
                 alt="${title}" 
                 class="w-full h-full object-cover" />
          ` : `
            <div class="w-full h-48 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
              <span class="material-symbols-outlined text-4xl">movie</span>
            </div>
          `}
          <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/35">
            <span class="material-symbols-outlined text-4xl text-white">play_circle</span>
          </div>
          <div class="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-100">${index === 0 ? 'Trending' : 'New'}</div>
        </div>
        <div class="px-1 pb-1">
          <h3 class="text-sm font-semibold text-white truncate" title="${title}">${title}</h3>
          <p class="mt-1 text-[11px] text-gray-400">${year} • ⭐${rating}</p>
          <p class="mt-2 line-clamp-2 text-[11px] text-slate-400">${overview}</p>
          <button type="button" class="w-full mt-3 rounded-lg bg-blue-600/90 py-2 text-[10px] font-black text-white transition hover:bg-blue-500" onclick="event.stopPropagation(); MOVIES.goToDownload(${movieIdForJs}, 'movie', ${movieJson})">WATCH NOW</button>
        </div>
      </article>
    `;
  },

  createLoadingState: (containerId, count = 6) => {
    const placeholders = Array.from({ length: count }, (_, index) => `
      <div class="animation-card rounded-2xl border border-white/10 bg-slate-900/80 p-2.5" key="${index}">
        <div class="animation-card__thumb mb-3 rounded-xl bg-slate-800 animate-pulse"></div>
        <div class="space-y-2">
          <div class="h-3 w-3/4 rounded-full bg-slate-800"></div>
          <div class="h-2.5 w-1/2 rounded-full bg-slate-800"></div>
          <div class="h-8 rounded-lg bg-slate-800"></div>
        </div>
      </div>
    `).join('');

    return `<div class="col-span-full flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="h-3 w-28 rounded-full bg-slate-800"></div>
        <div class="h-3 w-16 rounded-full bg-slate-800"></div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${placeholders}
      </div>
    </div>`;
  },

  normalizeMovie: (movie, fallbackLabel = 'Featured Movie') => {
    const safeMovie = movie || {};
    return {
      id: safeMovie.id || safeMovie.movieId || safeMovie.slug || `movie-${Math.random().toString(36).slice(2, 8)}`,
      title: safeMovie.title || safeMovie.name || safeMovie.original_title || fallbackLabel,
      overview: safeMovie.overview || safeMovie.description || 'A premium movie experience is ready to stream.',
      poster_path: safeMovie.poster_path || safeMovie.poster || safeMovie.image || '',
      vote_average: safeMovie.vote_average ?? safeMovie.rating ?? 8.0,
      release_date: safeMovie.release_date || safeMovie.year || '2024-01-01',
      genre_ids: safeMovie.genre_ids || []
    };
  },

  categorySections: [
    { id: 'animationMoviesCarousel', title: 'Animations', query: 'animation', type: 'search', layout: 'carousel' },
    { id: 'trendingMoviesCarousel', title: 'Trending Movies', query: '', type: 'trending', layout: 'carousel' },
    { id: 'trendingSeriesCarousel', title: 'Trending Series', query: 'trending series', type: 'search', layout: 'carousel' },
    { id: 'popularMoviesGrid', title: 'Popular Movies', query: '', type: 'popular', layout: 'grid' },
  ],

  createCategorySection: (containerId, title, layout = 'carousel', type = '') => {
    const wrapper = document.getElementById('menuContainers');
    if (!wrapper || document.getElementById(containerId)) return;

    const sidebarId = `${containerId}-sidebar`;
    const contentHtml = layout === 'grid'
      ? `<div id="${containerId}" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"></div>`
      : `<div class="animation-carousel-wrapper scrollbar-none w-full -mx-4 sm:-mx-10">
            <div id="${containerId}" class="animation-carousel gap-3 sm:gap-1 mx-auto w-full sm:w-auto"></div>
         </div>`;

    const typeDisplay = type ? String(type).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Movie';

    const sectionHtml = `
      <section id="${containerId}-section" class="max-w-7xl mx-auto px-6 py-10">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-black text-blue-500 uppercase tracking-tighter">${title}</h2>
          <button type="button" class="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition rounded-lg" data-sidebar-trigger="${sidebarId}">See All</button>
        </div>
        <div class="relative">
          ${contentHtml}
        </div>
      </section>

      <div id="${sidebarId}" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-300" onclick="document.getElementById('${sidebarId}').classList.add('hidden')"></div>
        <div class="relative origin-top transform-gpu w-full max-w-[95%] sm:max-w-6xl mx-auto max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-white/40 bg-white/45 p-4 shadow-[0_12px_45px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/35 dark:shadow-[0_18px_60px_rgba(2,6,23,0.45)] sm:p-6 lg:p-8">
          <button onclick="document.getElementById('${sidebarId}').classList.add('hidden')" class="absolute top-4 right-4 text-4xl text-slate-800 transition hover:text-blue-500 dark:text-white sm:right-6">&times;</button>
          <div class="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between md:gap-4">
            <div>
              <h2 class="text-2xl font-black uppercase tracking-[0.25em] text-blue-500 sm:text-3xl">${title}</h2>
              <p id="${sidebarId}-type" class="text-sm text-slate-300 mt-1">Type: ${typeDisplay}</p>
            </div>
            <div class="relative w-full md:max-w-md">
              <input class="sidebar-search-input w-full rounded-full border border-slate-700/70 bg-slate-950/95 py-3 pl-12 pr-4 text-sm text-white outline-none placeholder-slate-400 transition duration-200 ease-out focus:border-blue-400 focus:bg-slate-900/95 focus:ring-2 focus:ring-blue-500/30 sm:text-base leading-tight" type="text" placeholder="Search Movies..." data-sidebar-search="${sidebarId}">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base leading-none pointer-events-none transition-colors duration-200">search</span>
              <div class="sidebar-search-dropdown absolute left-0 right-0 top-full z-50 mt-2 hidden max-h-64 overflow-y-auto rounded-3xl border border-slate-800/80 bg-slate-950/95 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl" data-sidebar-dropdown="${sidebarId}"></div>
            </div>
          </div>
          <div id="${containerId}-sidebar-grid" class="mx-auto w-full grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"></div>
        </div>
      </div>
    `;

    wrapper.insertAdjacentHTML('beforeend', sectionHtml);

    // Attach sidebar trigger
    const button = document.querySelector(`[data-sidebar-trigger="${sidebarId}"]`);
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(sidebarId).classList.remove('hidden');
        MOVIES.loadSidebarContent(sidebarId, containerId);
      });
    }

    // Attach search to sidebar
    const searchInput = document.querySelector(`[data-sidebar-search="${sidebarId}"]`);
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (e.target.value.trim().length > 1) {
            MOVIES.searchSidebar(e.target.value, sidebarId, containerId);
          }
        }, 300);
      });
    }
  },

  loadCategorySection: async (section) => {
    const { id, query, type, layout } = section;
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = MOVIES.createLoadingState(id, 6);

    try {
      let data;
      if (type === 'trending') {
        data = await window.moviesAPI.getTrending();
      } else if (type === 'popular') {
        data = await window.moviesAPI.getPopular(1);
      } else {
        data = await window.moviesAPI.search(query, 1);
      }

      const results = (data?.results || []).slice(0, 12).map((movie) => MOVIES.normalizeMovie(movie, section.title));
      if (results.length === 0) {
        throw new Error(`No movies returned for ${section.title}`);
      }

      if (layout === 'grid') {
        MOVIES.renderGrid(id, results);
      } else {
        MOVIES.renderCarousel(id, results);
      }
    } catch (error) {
      console.error(`Error loading section ${section.title}:`, error);
      MOVIES.renderFallbackMovies(id);
    }
  },

  // Load sidebar content for a specific container
  loadSidebarContent: async (sidebarId, containerId) => {
    const gridId = `${containerId}-sidebar-grid`;
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = MOVIES.createLoadingState(gridId, 8);

    try {
      const section = MOVIES.categorySections.find((s) => s.id === containerId);
      if (!section) return;

      let data;
      if (section.type === 'trending') {
        data = await window.moviesAPI.getTrending();
      } else if (section.type === 'popular') {
        data = await window.moviesAPI.getPopular(1);
      } else {
        data = await window.moviesAPI.search(section.query, 1);
      }

      const results = (data?.results || []).slice(0, 50).map((movie) => MOVIES.normalizeMovie(movie, section.title));
      if (results.length === 0) {
        throw new Error(`No movies returned for ${section.title}`);
      }

      grid.innerHTML = results.map((m, i) => MOVIES.createMovieCard(m, i)).join('');
    } catch (error) {
      console.error(`Error loading sidebar ${sidebarId}:`, error);
      grid.innerHTML = `<div class="col-span-full text-center text-red-400">Failed to load content</div>`;
    }
  },

  searchSidebar: async (query, sidebarId, containerId) => {
    const gridId = `${containerId}-sidebar-grid`;
    const grid = document.getElementById(gridId);
    if (!grid) return;

    try {
      const data = await window.moviesAPI.search(query, 1);
      const results = (data?.results || []).slice(0, 50).map((movie) => MOVIES.normalizeMovie(movie));
      if (results.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-400">No results found</div>`;
        return;
      }
      grid.innerHTML = results.map((m, i) => MOVIES.createMovieCard(m, i)).join('');
    } catch (error) {
      console.error(`Error searching sidebar ${sidebarId}:`, error);
      grid.innerHTML = `<div class="col-span-full text-center text-red-400">Search failed</div>`;
    }
  },

  renderFallbackMovies: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fallbackCards = MOVIES.fallbackMovies.map((movie, index) => MOVIES.createMovieCard(MOVIES.normalizeMovie(movie), index)).join('');
    container.innerHTML = fallbackCards;
  },

  // Load trending movies
  loadTrending: async (containerId = 'animationCarousel') => {
    try {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = MOVIES.createLoadingState(containerId, 6);
      }

      const data = await window.moviesAPI.getTrending();
      if (data.results && data.results.length) {
        MOVIES.trending = data.results.slice(0, 20).map((movie) => MOVIES.normalizeMovie(movie));
        MOVIES.renderCarousel(containerId, MOVIES.trending);
        return;
      }

      throw new Error('No trending movies were returned');
    } catch (error) {
      console.error('Error loading trending movies:', error);
      MOVIES.renderFallbackMovies(containerId);
    }
  },

  // Load popular movies
  loadPopular: async () => {
    try {
      const container = document.getElementById('yu');
      if (container) {
        container.innerHTML = MOVIES.createLoadingState('yu', 8);
      }

      const data = await window.moviesAPI.getPopular(1);
      if (data.results && data.results.length) {
        MOVIES.popular = data.results.slice(0, 50).map((movie) => MOVIES.normalizeMovie(movie));
        MOVIES.renderGrid('yu', MOVIES.popular);
        return;
      }

      throw new Error('No popular movies were returned');
    } catch (error) {
      console.error('Error loading popular movies:', error);
      MOVIES.renderFallbackMovies('yu');
    }
  },

  // Search movies
  searchMovies: async (query) => {
    if (!query || query.trim().length < 2) {
      document.getElementById('movieSearchDropdown').classList.add('hidden');
      return;
    }

    try {
      const data = await window.moviesAPI.search(query, 1);
      if (data.results) {
        MOVIES.search = data.results.slice(0, 10);
        MOVIES.renderSearchDropdown('movieSearchDropdown', MOVIES.search);
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      MOVIES.showErrorMessage('Search failed');
    }
  },

  // Render carousel (horizontal scroll)
  renderCarousel: (containerId, movies) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!movies || movies.length === 0) {
      MOVIES.renderFallbackMovies(containerId);
      return;
    }
    
    container.innerHTML = movies.map((m, i) => MOVIES.createMovieCard(m, i)).join('');
  },

  // Render grid (all view)
  renderGrid: (containerId, movies) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!movies || movies.length === 0) {
      MOVIES.renderFallbackMovies(containerId);
      return;
    }
    
    container.innerHTML = movies.map((m, i) => MOVIES.createMovieCard(m, i)).join('');
  },

  // Render search dropdown
  renderSearchDropdown: (containerId, movies) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (movies.length === 0) {
      container.innerHTML = '<div class="p-4 text-gray-400 text-center">No results found</div>';
      container.classList.remove('hidden');
      return;
    }

    container.innerHTML = movies.map(movie => {
      const movieId = JSON.stringify(movie.id);
      const movieTitle = JSON.stringify(movie.title || '');
      return `
      <div class="p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition flex gap-3" onclick="MOVIES.selectMovie(${movieId}, ${movieTitle})">
        <img src="${MOVIES.getPosterUrl(movie.poster_path)}" alt="${movie.title}" class="w-12 h-16 object-cover rounded">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold truncate">${movie.title}</p>
          <p class="text-gray-400 text-xs">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
        </div>
      </div>
    `;
    }).join('');

    container.classList.remove('hidden');
  },

  // Select movie from search
  selectMovie: (movieId, title) => {
    const input = document.getElementById('movieSearchInput');
    input.value = title;
    document.getElementById('movieSearchDropdown').classList.add('hidden');
    MOVIES.goToDownload(movieId, 'movie');
  },

  goToDownload: (movieId, type = 'movie', movieMeta = null) => {
    if (movieMeta && typeof movieMeta === 'object') {
      try {
        sessionStorage.setItem('netchill_movie_preview', JSON.stringify(movieMeta));
      } catch (error) {
        console.warn('Unable to save preview movie data', error);
      }
    }
    const link = `./Download.html?id=${encodeURIComponent(movieId)}&type=${encodeURIComponent(type)}`;
    window.location.href = link;
  },

  formatStreamingProviders: (streaming, country = 'us') => {
    if (!streaming || typeof streaming !== 'object') {
      return '<p class="text-sm text-gray-300">No streaming availability data found.</p>';
    }

    const countryInfo = streaming[country] || streaming[Object.keys(streaming)[0]];
    if (!countryInfo || Object.keys(countryInfo).length === 0) {
      return '<p class="text-sm text-gray-300">No providers available for this region.</p>';
    }

    return Object.entries(countryInfo)
      .map(([provider, offers]) => {
        const offerList = offers.map((offer) => {
          const typeLabel = offer.type ? offer.type.replace(/_/g, ' ') : 'Unknown';
          const qualityLabel = offer.quality ? ` · ${offer.quality.toUpperCase()}` : '';
          return `<li class="text-sm text-slate-300">${typeLabel}${qualityLabel}</li>`;
        }).join('');

        return `
          <div class="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl">
            <h4 class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">${provider}</h4>
            <ul class="space-y-1">${offerList}</ul>
          </div>
        `;
      })
      .join('');
  },

  openMovieDetailModal: (contentHtml) => {
    const modal = document.getElementById('movieDetailModal');
    const content = document.getElementById('movieDetailContent');
    if (!modal || !content) return;
    content.innerHTML = contentHtml;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeMovieDetailModal: () => {
    const modal = document.getElementById('movieDetailModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  },

  // Navigate to the download page for movie details
  showMovieDetails: (movieId) => {
    MOVIES.goToDownload(movieId, 'movie');
  },

  // Play movie (placeholder for now)
  playMovie: (movieId, title) => {
    console.log('Playing:', title);
    // In a real app, this would navigate to a player page
    // For now, we'll save it and show a message
    if (window.downloadStorage) {
      window.downloadStorage.saveLastViewed({ id: movieId, title, viewedAt: new Date().toISOString() });
    }
    alert(`Now playing: ${title}\n\nRedirecting to player...`);
    // window.location.href = `./player.html?id=${movieId}`;
  },

  // Show error message
  showErrorMessage: (message) => {
    console.error(message);
    const containers = ['animationCarousel', 'yu', ...MOVIES.categorySections.map((section) => section.id)]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    containers.forEach((container) => {
      container.innerHTML = `<div class="col-span-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-red-300">${message}</div>`;
    });
  },

  // Initialize page
  init: async () => {
    console.log('Initializing movies page...');

    // Set up search input listener
    const searchInput = document.getElementById('movieSearchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          MOVIES.searchMovies(e.target.value);
        }, 300);
      });

      // Close dropdown on blur
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          document.getElementById('movieSearchDropdown').classList.add('hidden');
        }, 200);
      });
    }

    // Set up sidebar search
    const sidebarSearchInput = document.getElementById('sidebarMovieSearchInput');
    if (sidebarSearchInput) {
      let sidebarSearchTimeout;
      sidebarSearchInput.addEventListener('input', (e) => {
        clearTimeout(sidebarSearchTimeout);
        sidebarSearchTimeout = setTimeout(() => {
          if (e.target.value.trim().length > 1) {
            MOVIES.searchMovies(e.target.value);
          }
        }, 300);
      });
    }

    // Add detail modal close handlers
    const detailModal = document.getElementById('movieDetailModal');
    const detailModalClose = document.getElementById('closeMovieDetailModal');
    if (detailModal) {
      detailModal.addEventListener('click', (event) => {
        if (event.target === detailModal) {
          MOVIES.closeMovieDetailModal();
        }
      });
    }
    if (detailModalClose) {
      detailModalClose.addEventListener('click', MOVIES.closeMovieDetailModal);
    }

    // Create category sections dynamically and load API data into them
    MOVIES.categorySections.forEach((section) => {
      MOVIES.createCategorySection(section.id, section.title, section.layout, section.type);
    });

    await Promise.all(MOVIES.categorySections.map((section) => MOVIES.loadCategorySection(section)));

    const allMoviesContainer = document.getElementById('yu');
    if (allMoviesContainer) {
      await MOVIES.loadPopular();
    }

    console.log('Movies page initialized');
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MOVIES.init);
} else {
  MOVIES.init();
}
