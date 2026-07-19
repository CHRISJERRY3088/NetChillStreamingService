import express from 'express';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'streaming-availability.p.rapidapi.com';

const MOVIE_LIBRARY = [
  {
    id: 'hero-squad',
    title: 'Hero Squad',
    overview: 'A brave squad of heroes protects the city from a mysterious threat in this high-energy action adventure.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.6,
    release_date: '2024-04-08',
    genre_ids: [16, 28],
    genres: [{ id: 16, name: 'Animation' }, { id: 28, name: 'Action' }],
    credits: { cast: [{ name: 'Ava Brooks', character: 'Leader' }, { name: 'Noah Reed', character: 'Rogue' }] },
    type: 'movie',
  },
  {
    id: 'sky-riders',
    title: 'Sky Riders',
    overview: 'A daring team of aviators crosses stormy skies while uncovering a secret hidden above the clouds.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.2,
    release_date: '2023-11-14',
    genre_ids: [12, 14],
    genres: [{ id: 12, name: 'Adventure' }, { id: 14, name: 'Fantasy' }],
    credits: { cast: [{ name: 'Maya Chen', character: 'Captain' }, { name: 'Luis Vega', character: 'Navigator' }] },
    type: 'movie',
  },
  {
    id: 'ocean-drift',
    title: 'Ocean Drift',
    overview: 'A heartfelt story about survival and reconnecting with family during a journey across the open sea.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.0,
    release_date: '2022-09-20',
    genre_ids: [18, 10751],
    genres: [{ id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }],
    credits: { cast: [{ name: 'Riya Patel', character: 'Mother' }, { name: 'Marco Silva', character: 'Son' }] },
    type: 'movie',
  },
  {
    id: 'neon-city',
    title: 'Neon City',
    overview: 'A courier races through a neon future to protect a dangerous power source from falling into the wrong hands.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.4,
    release_date: '2024-01-18',
    genre_ids: [28, 878],
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }],
    credits: { cast: [{ name: 'Kira Nova', character: 'Courier' }, { name: 'Eli Vale', character: 'Hacker' }] },
    type: 'movie',
  },
  {
    id: 'moonlight',
    title: 'Moonlight',
    overview: 'A tender romance unfolds under the glow of the moon as two strangers find hope and connection.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 7.9,
    release_date: '2022-06-08',
    genre_ids: [18, 10749],
    genres: [{ id: 18, name: 'Drama' }, { id: 10749, name: 'Romance' }],
    credits: { cast: [{ name: 'Nina Hart', character: 'Lena' }, { name: 'Jules Carter', character: 'Noah' }] },
    type: 'movie',
  },
  {
    id: 'pixel-quest',
    title: 'Pixel Quest',
    overview: 'A gamer is pulled into a digital world and must restore balance before reality collapses.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.1,
    release_date: '2024-03-04',
    genre_ids: [878, 12],
    genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
    credits: { cast: [{ name: 'Lena Cross', character: 'Hero' }, { name: 'Aiden Fox', character: 'Guide' }] },
    type: 'movie',
  },
  {
    id: 'the-last-horizon',
    title: 'The Last Horizon',
    overview: 'An explorer follows the last known trail to the edge of the earth in search of a lost civilization.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.3,
    release_date: '2024-05-03',
    genre_ids: [12, 9648],
    genres: [{ id: 12, name: 'Adventure' }, { id: 9648, name: 'Mystery' }],
    credits: { cast: [{ name: 'Sofia Lane', character: 'Explorer' }, { name: 'Jonas Bly', character: 'Historian' }] },
    type: 'movie',
  },
  {
    id: 'midnight-run',
    title: 'Midnight Run',
    overview: 'A fast-paced thriller that follows a courier racing through the city to clear an innocent name.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.0,
    release_date: '2021-10-27',
    genre_ids: [28, 53],
    genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }],
    credits: { cast: [{ name: 'Mason Cole', character: 'Runner' }, { name: 'Tess Vega', character: 'Detective' }] },
    type: 'movie',
  },
];

const TRAILER_LIBRARY = [
  {
    id: 'hero-squad',
    image: "url('./assets/bg.png')",
    badge: 'Now Showing',
    eyebrow: 'Watch the latest movies & shows',
    title: 'Stream your favorites anytime',
    subtitle: 'A cinematic home for your next binge.',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    trailer_button_text: 'Watch Trailer',
  },
  {
    id: 'sky-riders',
    image: "url('./assets/td.png')",
    badge: 'New Release',
    eyebrow: 'Discover new releases',
    title: 'Fresh stories, ready to stream',
    subtitle: 'Catch the biggest premieres before they hit the mainstream.',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    trailer_button_text: 'Watch Sky Riders Trailer',
  },
  {
    id: 'ocean-drift',
    image: "url('./assets/yd.png')",
    badge: 'Top Rated',
    eyebrow: 'Stream top-rated picks',
    title: 'Critics love these scenes',
    subtitle: 'A handpicked lineup of fan favorites and hidden gems.',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    trailer_button_text: 'Watch Ocean Drift Trailer',
  },
  {
    id: 'neon-city',
    image: "url('./assets/tb.png')",
    badge: 'Blockbuster',
    eyebrow: 'Enjoy blockbuster hits',
    title: 'Big action, bigger energy',
    subtitle: 'Turn every night into a premium movie night.',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    trailer_button_text: 'Watch Neon City Trailer',
  },
  {
    id: 'moonlight',
    image: "url('./assets/tf.png')",
    badge: 'Fan Favorite',
    eyebrow: 'Find your next favorite',
    title: 'Your next obsession starts here',
    subtitle: 'Explore stories crafted for late-night marathons.',
    trailer_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    trailer_button_text: 'Watch Moonlight Trailer',
  },
];

const typeMap = {
  movie: 'movie',
  series: 'series',
  tv: 'series',
  show: 'series',
};

const normalizeId = (value) => String(value || '').toLowerCase().trim();

const normalizeRapidMovie = (item) => {
  if (!item || typeof item !== 'object') return null;
  const poster = item.posterURLs?.original || item.posterURLs?.small || item.poster || item.image || '';
  const backdrop = item.backdropURLs?.original || item.backdrop || item.backdrop_path || '';
  const genres = Array.isArray(item.genres)
    ? item.genres.map((genre) => (typeof genre === 'string' ? { name: genre } : genre))
    : (typeof item.genre === 'string' ? item.genre.split(',').map((name) => ({ name: name.trim() })) : []);

  return {
    id: item.imdbID || item.tmdbID || item.id || item.title || item.name || `movie-${Math.random().toString(36).slice(2, 8)}`,
    title: item.title || item.name || item.original_title || item.originalName || 'Untitled',
    overview: item.overview || item.description || item.synopsis || item.plot || '',
    poster_path: poster,
    backdrop_path: backdrop,
    vote_average: item.imdbRating ? Number(item.imdbRating) : item.vote_average ?? item.rating ?? 0,
    release_date: item.year ? `${item.year}-01-01` : item.release_date || item.firstAirDate || '',
    genres,
    credits: item.cast ? { cast: item.cast } : item.credits || {},
    type: 'movie',
    raw: item,
  };
};

const fetchRapidApi = async (path, params = {}) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('Streaming API key not configured');
  }

  const url = new URL(`https://${RAPIDAPI_HOST}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.message || `RapidAPI request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
};

const normalizeRapidMovieList = (data) => {
  if (!data || typeof data !== 'object') return [];
  const items = Array.isArray(data.results) ? data.results : data.result || [];
  return items
    .map(normalizeRapidMovie)
    .filter(Boolean);
};

const searchRapidMovies = async (keyword, page = 1) => {
  const data = await fetchRapidApi('/search/basic', {
    country: 'us',
    keyword: String(keyword || '').trim(),
    type: 'movie',
    page: String(page),
  });
  return normalizeRapidMovieList(data);
};

const trailerQueries = [
  { query: 'Daredevil Season 4', badge: 'Daredevil S4', buttonText: 'Watch Daredevil Season 4 Trailer' },
  { query: 'Hexed', badge: 'Hexed', buttonText: 'Watch Hexed Trailer' },
  { query: 'Season 4', badge: 'Season 4', buttonText: 'Watch Season 4 Trailer' },
];

const extractTrailerUrlFromItem = (item) => {
  if (!item || typeof item !== 'object') return '';
  return item.trailerUrl || item.trailer_url || item.trailerURL || item.trailer || item.videoUrl || item.video_url || item.videoURL || item.video || item.youtubeUrl || item.youtube_url || item.youtubeVideoUrl || item.youtube_video_url || item.url || item.link || '';
};

const formatSlideImage = (path) => {
  if (!path || typeof path !== 'string') return "url('./assets/bg.png')";
  if (path.startsWith('url(')) return path;
  return `url('${String(path).replace(/'/g, "\\'")}')`;
};

const normalizeTrailerItem = (item, fallbackQuery) => {
  const title = item?.title || item?.name || fallbackQuery || 'Trailer';
  const overview = item?.overview || item?.description || item?.synopsis || item?.plot || `Watch the ${title} trailer now.`;
  const imageSource = item?.poster_path || item?.poster || item?.image || item?.backdrop_path || item?.backdrop || '';
  const trailerUrl = extractTrailerUrlFromItem(item);

  return {
    id: item?.id || title.toLowerCase().replace(/\s+/g, '-'),
    badge: fallbackQuery,
    eyebrow: title,
    title,
    subtitle: overview,
    image: formatSlideImage(imageSource),
    trailer_url: trailerUrl || '../Hexed%20-%20Official%20Teaser%20Trailer.mp4',
    trailer_button_text: `Watch ${title} Trailer`,
  };
};

const fetchTrailerSlides = async () => {
  const slideResults = [];

  for (const config of trailerQueries) {
    try {
      const results = await searchRapidMovies(config.query, 1);
      const first = results[0];
      if (first) {
        slideResults.push({
          ...normalizeTrailerItem(first.raw || first, config.query),
          badge: config.badge,
          trailer_button_text: config.buttonText,
        });
        continue;
      }
    } catch (error) {
      console.warn('Trailer search failed for', config.query, error);
    }

    slideResults.push({
      id: config.query.toLowerCase().replace(/\s+/g, '-'),
      badge: config.badge,
      eyebrow: config.query,
      title: config.query,
      subtitle: `Watch the ${config.query} trailer now.`,
      image: "url('./assets/bg.png')",
      trailer_url: '../Hexed%20-%20Official%20Teaser%20Trailer.mp4',
      trailer_button_text: config.buttonText,
    });
  }

  return slideResults;
};

const searchMovies = (query) => {
  const normalized = String(query || '').toLowerCase().trim();
  if (!normalized) return [];
  return MOVIE_LIBRARY.filter((movie) => {
    const searchable = [movie.title, movie.overview, movie.genres?.map((g) => g.name).join(' '), movie.release_date].join(' ').toLowerCase();
    return searchable.includes(normalized);
  });
};

router.get('/trending', async (req, res) => {
  try {
    const results = await searchRapidMovies('trending', 1);
    return res.json({ results: results.slice(0, 8) });
  } catch (error) {
    console.error('Trending fetch failed:', error);
    const results = MOVIE_LIBRARY.slice(0, 8);
    return res.json({ results });
  }
});

router.get('/popular', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  try {
    const results = await searchRapidMovies('popular', page);
    return res.json({ results, page, total_pages: Math.ceil(results.length / 12), total_results: results.length });
  } catch (error) {
    console.error('Popular fetch failed:', error);
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    const results = MOVIE_LIBRARY.slice(start, start + pageSize);
    return res.json({ results, page, total_pages: Math.ceil(MOVIE_LIBRARY.length / pageSize), total_results: MOVIE_LIBRARY.length });
  }
});

router.get('/top-rated', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  try {
    const results = await searchRapidMovies('best', page);
    return res.json({ results, page, total_pages: Math.ceil(results.length / 12), total_results: results.length });
  } catch (error) {
    console.error('Top-rated fetch failed:', error);
    const sorted = [...MOVIE_LIBRARY].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    const results = sorted.slice(start, start + pageSize);
    return res.json({ results, page, total_pages: Math.ceil(sorted.length / pageSize), total_results: sorted.length });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query || String(query).trim().length === 0) {
    return res.json({ results: [] });
  }

  try {
    const results = await searchRapidMovies(query, 1);
    return res.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Search fetch failed:', error);
    const results = searchMovies(query).slice(0, 20);
    return res.json({ results });
  }
});

router.get('/details/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const apiType = 'movie';
    const data = await fetchRapidApi(`/shows/${apiType}/${encodeURIComponent(id)}`, { country: 'us' });
    const movie = normalizeRapidMovie(data);
    if (!movie) {
      throw new Error('Unable to normalize movie details');
    }
    return res.json(movie);
  } catch (error) {
    console.error('Details fetch failed:', error);
    const movie = findMovieById(id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    return res.json(movie);
  }
});

router.get('/genre/:id', (req, res) => {
  const genreId = req.params.id.toLowerCase();
  const results = MOVIE_LIBRARY.filter((movie) => {
    const genreMatches = movie.genre_ids?.some((genre) => String(genre).toLowerCase() === genreId);
    const genreNameMatches = movie.genres?.some((genre) => genre.name.toLowerCase() === genreId);
    return genreMatches || genreNameMatches;
  });
  return res.json({ results });
});

router.get('/trailers', async (req, res) => {
  try {
    const slides = await fetchTrailerSlides();
    if (slides && slides.length > 0) {
      return res.json({ results: slides });
    }
  } catch (error) {
    console.error('Trailer route failed:', error);
  }
  return res.json({ results: TRAILER_LIBRARY });
});

router.get('/streaming/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const country = req.query.country || 'us';

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Streaming API key not configured' });
  }

  const apiType = typeMap[type.toLowerCase()] || type.toLowerCase();
  if (!['movie', 'series'].includes(apiType)) {
    return res.status(400).json({ error: 'Invalid streaming type. Use movie or series.' });
  }

  try {
    const url = new URL(`https://${RAPIDAPI_HOST}/shows/${apiType}/${encodeURIComponent(id)}`);
    if (country) {
      url.searchParams.set('country', country);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Streaming availability error:', error);
    res.status(500).json({ error: 'Failed to fetch streaming availability' });
  }
});

export default router;
