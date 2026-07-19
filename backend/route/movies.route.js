import express from 'express';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ✅ Get Trending Movies (TMDB)
router.get('/trending', async (req, res) => {
  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Trending movies error:', error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// ✅ Search Movies (TMDB)
router.get('/search', async (req, res) => {
  const { query, page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ✅ Get Movie Details (TMDB)
router.get('/details/:id', async (req, res) => {
  const { id } = req.params;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=videos,credits`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Movie details error:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// ✅ Get Streaming Availability (RapidAPI)
router.get('/streaming/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    return res.status(500).json({ error: 'Streaming API not configured' });
  }

  // Map type: 'movie' -> '1', 'series' -> '2'
  const typeMap = {
    'movie': '1',
    'series': '2',
    'tv': '2',
  };

  const apiType = typeMap[type.toLowerCase()] || '1';

  try {
    const response = await fetch(
      `https://streaming-availability.p.rapidapi.com/shows/${apiType}/${id}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
          'Content-Type': 'application/json',
        },
      }
    );

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

// ✅ Get Popular Movies (TMDB)
router.get('/popular', async (req, res) => {
  const { page = 1 } = req.query;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Popular movies error:', error);
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

// ✅ Get Top Rated Movies (TMDB)
router.get('/top-rated', async (req, res) => {
  const { page = 1 } = req.query;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Top rated movies error:', error);
    res.status(500).json({ error: 'Failed to fetch top rated movies' });
  }
});

// ✅ Get Movies by Genre (TMDB)
router.get('/genre/:genreId', async (req, res) => {
  const { genreId, page = 1 } = req.query;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${req.params.genreId}&page=${page}&language=en-US`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Genre movies error:', error);
    res.status(500).json({ error: 'Failed to fetch genre movies' });
  }
});

export default router;
