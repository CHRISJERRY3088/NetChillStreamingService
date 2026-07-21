import express from 'express';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'streaming-availability.p.rapidapi.com';

const MOVIE_LIBRARY = [
  {
    id: 'fallback-horizon',
    title: 'The Last Horizon',
    overview: 'A daring crew races across a storm-ridden frontier to uncover a hidden city before the world closes in.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.2,
    release_date: '2024-01-01',
    genres: [{ name: 'Adventure' }, { name: 'Animation' }],
    credits: { cast: ['Mina Brooks'] },
    type: 'movie',
  },
  {
    id: 'fallback-shadow',
    title: 'Midnight Circuit',
    overview: 'A brilliant mechanic discovers a rogue AI that can predict every move in a citywide street race.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 7.9,
    release_date: '2023-09-14',
    genres: [{ name: 'Sci-Fi' }],
    credits: { cast: ['Leo Hart'] },
    type: 'movie',
  },
  {
    id: 'fallback-signal',
    title: 'Signal North',
    overview: 'An isolated radio operator receives a frequency that carries the voices of people lost at sea.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.5,
    release_date: '2022-11-03',
    genres: [{ name: 'Mystery' }],
    credits: { cast: ['Jules Moore'] },
    type: 'movie',
  },
  {
    id: 'fallback-sunset',
    title: 'Sunset Reign',
    overview: 'A disgraced prince must rebuild a kingdom while confronting the curse that follows his bloodline.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 7.7,
    release_date: '2021-07-22',
    genres: [{ name: 'Fantasy' }],
    credits: { cast: ['Rae Turner'] },
    type: 'movie',
  },
  {
    id: 'fallback-echo',
    title: 'Echo Bay',
    overview: 'When a quiet town begins to vanish overnight, a young archivist uncovers a buried history.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.0,
    release_date: '2024-03-18',
    genres: [{ name: 'Thriller' }],
    credits: { cast: ['Nia Ellis'] },
    type: 'movie',
  },
  {
    id: 'fallback-aurora',
    title: 'Aurora Run',
    overview: 'Two rival pilots join forces to outrun a government experiment hunting the last free skies.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 7.8,
    release_date: '2023-02-09',
    genres: [{ name: 'Action' }],
    credits: { cast: ['Kian Brooks'] },
    type: 'movie',
  },
  {
    id: 'fallback-lantern',
    title: 'Lantern House',
    overview: 'A family inherits a mansion that only reveals its secrets at midnight.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 7.4,
    release_date: '2020-10-15',
    genres: [{ name: 'Horror' }],
    credits: { cast: ['Sage Cole'] },
    type: 'movie',
  },
  {
    id: 'fallback-velvet',
    title: 'Velvet Rewind',
    overview: 'A memory archivist gets one last chance to save a lost love trapped in an old film reel.',
    poster_path: '',
    backdrop_path: '',
    vote_average: 8.3,
    release_date: '2025-01-12',
    genres: [{ name: 'Romance' }, { name: 'Comedy' }],
    credits: { cast: ['Ava Stone'] },
    type: 'movie',
  },
];
const TRAILER_LIBRARY = [
  {
    id: 'fallback-trailer-1',
    title: 'The Last Horizon',
    overview: 'A thrilling teaser for the frontier adventure that is now streaming.',
    poster_path: '',
    backdrop_path: '',
    trailer_url: '',
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

const normalizeKeyword = (value) => String(value || '').toLowerCase().trim();

const getFallbackMovieResults = (keyword, page = 1) => {
  const normalizedKeyword = normalizeKeyword(keyword);
  const baseMovies = [...MOVIE_LIBRARY];
  const queryTerms = normalizedKeyword.split(/[^a-z0-9]+/).filter(Boolean);

  const movieMatchesQuery = (movie) => {
    if (!queryTerms.length) return true;

    const haystack = [
      movie?.title || '',
      movie?.overview || '',
      (movie?.genres || []).map((genre) => genre?.name || '').join(' '),
      (movie?.credits?.cast || []).join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return queryTerms.some((term) => haystack.includes(term));
  };

  let filtered = baseMovies;
  if (normalizedKeyword.includes('popular')) {
    filtered = baseMovies.slice(1, 5);
  } else if (normalizedKeyword.includes('best') || normalizedKeyword.includes('top')) {
    filtered = baseMovies.slice(2, 7);
  } else if (normalizedKeyword.includes('trending')) {
    filtered = baseMovies.slice(0, 4);
  } else if (normalizedKeyword.includes('series') || normalizedKeyword.includes('tv')) {
    filtered = baseMovies.slice(4, 8);
  } else if (queryTerms.length > 0) {
    filtered = baseMovies.filter(movieMatchesQuery);
  }

  if (!filtered.length) {
    filtered = baseMovies;
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const startIndex = (pageNumber - 1) * 8;
  return filtered.slice(startIndex, startIndex + 8).map((movie) => normalizeRapidMovie(movie));
};

const searchRapidMovies = async (keyword, page = 1) => {
  if (!RAPIDAPI_KEY) {
    return getFallbackMovieResults(keyword, page);
  }

  try {
    const data = await fetchRapidApi('/search/basic', {
      country: 'us',
      keyword: String(keyword || '').trim(),
      type: 'movie',
      page: String(page),
    });
    return normalizeRapidMovieList(data);
  } catch (error) {
    console.warn('RapidAPI search failed, using fallback movie data:', error.message);
    return getFallbackMovieResults(keyword, page);
  }
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
      badge: config.badge,
      eyebrow: config.query,
      title: config.query,
      subtitle: `Watch the ${config.query} trailer now.`,
      image: '',
      trailer_url: '',
      trailer_button_text: config.buttonText,
    });
  }

  return slideResults;
};

const searchMovies = (query) => {
  return [];
};

router.get('/trending', async (req, res) => {
  try {
    const results = await searchRapidMovies('trending', 1);
    return res.json({ results: results.slice(0, 8) });
  } catch (error) {
    console.error('Trending fetch failed:', error);
    return res.json({ results: [] });
  }
});

router.get('/popular', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  try {
    const results = await searchRapidMovies('popular', page);
    return res.json({ results, page, total_pages: Math.ceil(results.length / 12), total_results: results.length });
  } catch (error) {
    console.error('Popular fetch failed:', error);
    return res.json({ results: [], page, total_pages: 0, total_results: 0 });
  }
});

router.get('/top-rated', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  try {
    const results = await searchRapidMovies('best', page);
    return res.json({ results, page, total_pages: Math.ceil(results.length / 12), total_results: results.length });
  } catch (error) {
    console.error('Top-rated fetch failed:', error);
    return res.json({ results: [], page, total_pages: 0, total_results: 0 });
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
    return res.json({ results: [] });
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
    return res.status(404).json({ error: 'Movie not found' });
  }
});

router.get('/genre/:id', (req, res) => {
  return res.json({ results: [] });
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
  return res.json({ results: [] });
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

export { getFallbackMovieResults };
export default router;
