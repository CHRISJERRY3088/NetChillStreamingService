import express from 'express';

const router = express.Router();

const JIKAN_BASE = 'https://api.jikan.moe/v4';

const normalizeJikanAnimeForSection = (anime) => {
  if (!anime || typeof anime !== 'object') return null;

  const title = anime.title || anime.title_english || anime.title_japanese || 'Anime Movie';
  const synopsis = typeof anime.synopsis === 'string' ? anime.synopsis.replace(/\s+/g, ' ').trim() : '';
  const poster = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.images?.webp?.large_image_url || '';
  const airedYear = anime.year || (anime.aired?.prop?.from?.year ? String(anime.aired.prop.from.year) : '');
  const genres = Array.isArray(anime.genres) ? anime.genres.map((genre) => genre.name).slice(0, 2) : [];
  const rating = anime.score ?? anime.rating ?? null;

  return {
    id: anime.mal_id || anime.id || `jikan-${Math.random().toString(36).slice(2, 10)}`,
    title,
    subtitle: synopsis || `${airedYear ? `${airedYear} • ` : ''}${genres.join(' • ') || 'Top-rated anime movie'}`,
    overview: synopsis || 'A featured anime movie from Jikan.',
    release_date: anime.aired?.prop?.from?.year ? `${anime.aired.prop.from.year}-01-01` : (anime.year ? `${anime.year}-01-01` : ''),
    vote_average: rating,
    poster_path: poster,
    poster,
    image: poster,
    genre: genres.join(' • ') || 'Animation',
    year: airedYear,
    raw: anime,
  };
};

const proxyFetch = async (url) => {
  const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data?.message || `Jikan request failed with status ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return data;
};

router.get('/top-movies', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 8);
  try {
    const url = `${JIKAN_BASE}/top/anime?type=movie&limit=${limit}`;
    const payload = await proxyFetch(url);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const normalized = items.map(normalizeJikanAnimeForSection).filter(Boolean);
    return res.json({ results: normalized.slice(0, limit) });
  } catch (error) {
    console.error('Jikan top-movies proxy failed:', error.message || error);
    return res.status(502).json({ results: [] });
  }
});

router.get('/search', async (req, res) => {
  const query = String(req.query.query || '').trim();
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 8);
  if (!query) return res.json({ results: [] });

  try {
    const url = `${JIKAN_BASE}/anime?type=movie&q=${encodeURIComponent(query)}&limit=${limit}`;
    const payload = await proxyFetch(url);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const normalized = items.map(normalizeJikanAnimeForSection).filter(Boolean);
    return res.json({ results: normalized.slice(0, limit) });
  } catch (error) {
    console.error('Jikan search proxy failed:', error.message || error);
    return res.status(502).json({ results: [] });
  }
});

export default router;
