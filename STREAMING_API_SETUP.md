# Streaming API Integration Updated

This project no longer depends on The Movie Database (TMDB) for core streaming lookups.

## What Changed

- Backend now uses the RapidAPI Streaming Availability service for where-to-watch data.
- TMDB-specific routes and TMDB API key requirements were removed from the backend.
- Frontend no longer prepends the TMDB image domain; it will use full image URLs returned by APIs and fall back to a placeholder when none are available.

## Backend

- Required env: `RAPIDAPI_KEY` (add to `backend/.env`). Optional: `RAPIDAPI_HOST` (defaults to `streaming-availability.p.rapidapi.com`).
- Available endpoint: `GET /api/movies/streaming/:type/:id?country=us` — returns streaming availability for `movie` or `series`.

Example cURL using the RapidAPI host/key:

```bash
curl --request GET \
  --url 'https://streaming-availability.p.rapidapi.com/shows/movie/<<ID>>?country=us' \
  --header 'Content-Type: application/json' \
  --header 'x-rapidapi-host: streaming-availability.p.rapidapi.com' \
  --header 'x-rapidapi-key: <YOUR_RAPIDAPI_KEY>'
```

## Frontend

- The frontend expects `window.moviesAPI.getStreaming(type, id)` for availability lookups.
- Poster rendering no longer assumes TMDB paths — it uses full URLs returned by the API or shows a placeholder.

## Removed / Updated Docs

- TMDB key setup steps and TMDB-specific instructions were removed from this guide.

## Next Steps

- Ensure `RAPIDAPI_KEY` is set in `backend/.env`.
- If you still need TMDB poster images, provide full image URLs from your source or host poster images locally.

**Status**: ✅ Updated — TMDB references removed from code and docs
