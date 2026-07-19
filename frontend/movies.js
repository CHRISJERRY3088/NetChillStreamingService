// Movies Page Controller - Loads real movies from TMDB API
// This script handles trending, popular, and search functionality

const MOVIES = {
  trending: [],
  popular: [],
  search: [],
  selectedMovie: null,

  // Generate poster URL for TMDB
  getPosterUrl: (posterPath) => {
    if (!posterPath) return './assets/placeholder.jpg';
    return `https://image.tmdb.org/t/p/w342${posterPath}`;
  },

  // Format genres from TMDB data
  getGenreText: (genreIds, genreList) => {
    if (!genreIds || genreIds.length === 0) return 'Movie';
    return genreIds.slice(0, 2).map(id => {
      const genre = genreList.find(g => g.id === id);
      return genre ? genre.name : '';
    }).filter(Boolean).join(' • ');
  },

  // Create movie card HTML
  createMovieCard: (movie, index = 0) => {
    const { id, title, poster_path, vote_average, release_date } = movie;
    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
    
    return `
      <article class="animation-card group rounded-2xl p-2.5 cursor-pointer" data-movie-id="${id}" onclick="MOVIES.showMovieDetails(${id})">
        <div class="animation-card__thumb mb-3 rounded-xl relative overflow-hidden bg-gray-800">
          <img src="${MOVIES.getPosterUrl(poster_path)}" 
               alt="${title}" 
               class="w-full h-full object-cover"
               onerror="this.src='./assets/placeholder.jpg'">
          <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/35">
            <span class="material-symbols-outlined text-4xl text-white">play_circle</span>
          </div>
          <div class="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-100">${index === 0 ? 'Trending' : 'New'}</div>
        </div>
        <div class="px-1 pb-1">
          <h3 class="text-sm font-semibold text-white truncate" title="${title}">${title}</h3>
          <p class="mt-1 text-[11px] text-gray-400">${year} • ⭐${rating}</p>
          <button class="w-full mt-3 rounded-lg bg-blue-600/90 py-2 text-[10px] font-black text-white transition hover:bg-blue-500" onclick="event.stopPropagation(); MOVIES.playMovie(${id}, '${title}')">WATCH NOW</button>
        </div>
      </article>
    `;
  },

  // Load trending movies
  loadTrending: async () => {
    try {
      console.log('Loading trending movies...');
      const data = await window.moviesAPI.getTrending();
      if (data.results) {
        MOVIES.trending = data.results.slice(0, 20);
        MOVIES.renderCarousel('animationCarousel', MOVIES.trending);
      }
    } catch (error) {
      console.error('Error loading trending movies:', error);
      MOVIES.showErrorMessage('Failed to load trending movies');
    }
  },

  // Load popular movies
  loadPopular: async () => {
    try {
      console.log('Loading popular movies...');
      const data = await window.moviesAPI.getPopular(1);
      if (data.results) {
        MOVIES.popular = data.results.slice(0, 50);
        MOVIES.renderGrid('yu', MOVIES.popular);
      }
    } catch (error) {
      console.error('Error loading popular movies:', error);
      MOVIES.showErrorMessage('Failed to load popular movies');
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
    
    container.innerHTML = movies.map((m, i) => MOVIES.createMovieCard(m, i)).join('');
  },

  // Render grid (all view)
  renderGrid: (containerId, movies) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
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

    container.innerHTML = movies.map(movie => `
      <div class="p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition flex gap-3" onclick="MOVIES.selectMovie(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
        <img src="${MOVIES.getPosterUrl(movie.poster_path)}" alt="${movie.title}" class="w-12 h-16 object-cover rounded">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold truncate">${movie.title}</p>
          <p class="text-gray-400 text-xs">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
        </div>
      </div>
    `).join('');

    container.classList.remove('hidden');
  },

  // Select movie from search
  selectMovie: (movieId, title) => {
    const input = document.getElementById('movieSearchInput');
    input.value = title;
    document.getElementById('movieSearchDropdown').classList.add('hidden');
    MOVIES.showMovieDetails(movieId);
  },

  // Show movie details (can extend with modal)
  showMovieDetails: async (movieId) => {
    try {
      console.log('Loading movie details:', movieId);
      const data = await window.moviesAPI.getDetails(movieId);
      console.log('Movie details:', data);
      // You can display this in a modal or navigate to a detail page
      alert(`${data.title}\n${data.overview}\n\n⭐ ${data.vote_average.toFixed(1)}/10`);
    } catch (error) {
      console.error('Error loading movie details:', error);
      MOVIES.showErrorMessage('Failed to load movie details');
    }
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
    const container = document.getElementById('animationCarousel');
    if (container) {
      container.innerHTML = `<div class="col-span-full text-center text-red-400 py-8">${message}</div>`;
    }
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

    // Load trending movies
    await MOVIES.loadTrending();

    // Load popular movies if all view is visible
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
