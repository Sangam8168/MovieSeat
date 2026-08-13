import axios from "axios";
import { cached, cacheClear } from "./cache.js";

// Movie data pipeline.
//   Details / search : OMDB
//   Posters          : OMDB, then Fanart.tv as a fallback
//
// Artwork resolves to an ordered list of candidates rather than one URL;
// SmartImage walks the list in the browser on load failure.

const OMDB_BASE = "http://www.omdbapi.com/";
const FANART_BASE = "https://webservice.fanart.tv/v3/movies";

const DETAIL_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const SEARCH_TTL = 12 * 60 * 60 * 1000; // 12 hours

export const clearMovieCache = cacheClear;

// Reads an env var, treating unfilled `.env` placeholders as unset.
const envKey = (name) => {
  const v = process.env[name];
  if (!v) return undefined;
  const trimmed = String(v).trim();
  if (!trimmed || /^your_/i.test(trimmed) || trimmed.startsWith("<")) {
    return undefined;
  }
  return trimmed;
};

const isUsable = (v) => v && v !== "N/A";

// Fanart.tv artwork. One request returns every image type, so both
// orientations come from a single call. Prefers English or language-neutral
// artwork, falling back to the most-liked of any language.
const artworkFromFanart = async (imdbId) => {
  const key = envKey("FANART_API_KEY");
  if (!key || !imdbId) return { poster: null, backdrop: null };

  try {
    const { data } = await axios.get(`${FANART_BASE}/${imdbId}`, {
      params: { api_key: key },
      timeout: 8000,
    });

    const preferred = (list) => {
      if (!Array.isArray(list) || list.length === 0) return null;
      const neutral = list.find((i) => i.lang === "en" || i.lang === "00");
      return (neutral || list[0]).url || null;
    };

    return {
      poster: preferred(data?.movieposter) || preferred(data?.moviethumb),
      backdrop: preferred(data?.moviebackground) || preferred(data?.moviethumb),
    };
  } catch {
    return { poster: null, backdrop: null };
  }
};

// Builds the ordered artwork candidates. `seedPoster` is OMDB's own Poster.
export const resolveArtwork = async (imdbId, seedPoster) =>
  cached(`art:${imdbId}`, DETAIL_TTL, async () => {
    const fanart = await artworkFromFanart(imdbId);

    return {
      posters: [seedPoster, fanart.poster].filter(isUsable),
      backdrops: [fanart.backdrop].filter(isUsable),
    };
  });

/** Normalises an OMDB detail payload into the shape the client expects. */
export const mapOmdbMovie = (d, artwork = { posters: [], backdrops: [] }) => {
  const posters = [...artwork.posters];
  if (isUsable(d.Poster) && !posters.includes(d.Poster)) posters.push(d.Poster);

  return {
    _id: d.imdbID,
    id: d.imdbID,
    title: d.Title,
    overview: isUsable(d.Plot) ? d.Plot : "",
    tagline: "",
    release_date: isUsable(d.Released) ? d.Released : d.Year || "",
    year: d.Year,
    original_language: isUsable(d.Language) ? d.Language : "",
    genres: isUsable(d.Genre)
      ? d.Genre.split(", ").map((name) => ({ id: name, name }))
      : [],
    casts: isUsable(d.Actors)
      ? d.Actors.split(", ").map((name) => ({ name, profile_path: "" }))
      : [],
    vote_average: parseFloat(d.imdbRating) || 0,
    vote_count: parseInt(String(d.imdbVotes).replace(/,/g, ""), 10) || 0,
    runtime: parseInt(d.Runtime, 10) || 0,
    poster_path: posters[0] || "",
    backdrop_path: artwork.backdrops[0] || posters[0] || "",
    poster_candidates: posters,
    backdrop_candidates: artwork.backdrops.length
      ? artwork.backdrops
      : posters,
  };
};

/** Full details for one IMDb id. */
export const fetchMovieDetails = async (movieId) => {
  const key = envKey("OMDB_API_KEY");
  if (!key) return null;

  return cached(`movie:${movieId}`, DETAIL_TTL, async () => {
    try {
      const { data } = await axios.get(OMDB_BASE, {
        params: { apikey: key, i: movieId, plot: "full" },
        timeout: 10000,
      });

      if (data?.Response === "False") {
        console.error(`OMDB lookup failed for ${movieId}:`, data.Error);
        return null;
      }

      const artwork = await resolveArtwork(movieId, data.Poster);
      return mapOmdbMovie(data, artwork);
    } catch (error) {
      console.error(`OMDB lookup failed for ${movieId}:`, error.message);
      return null;
    }
  });
};

/** Title search - the admin's primary way to find a film. */
export const searchMovies = async (query) => {
  const key = envKey("OMDB_API_KEY");
  if (!key) return [];

  const result = await cached(
    `search:${query.toLowerCase()}`,
    SEARCH_TTL,
    async () => {
      try {
        const { data } = await axios.get(OMDB_BASE, {
          params: { apikey: key, s: query, type: "movie" },
          timeout: 10000,
        });

        if (data?.Response === "False") return [];

        // Search returns title/year/poster only; details are fetched on add
        return (data.Search || []).map((m) => ({
          _id: m.imdbID,
          id: m.imdbID,
          title: m.Title,
          year: m.Year,
          poster_path: isUsable(m.Poster) ? m.Poster : "",
          poster_candidates: isUsable(m.Poster) ? [m.Poster] : [],
        }));
      } catch (error) {
        console.error("OMDB search failed:", error.message);
        return null;
      }
    }
  );

  return result || [];
};

// OMDB has no box-office endpoint; the admin page uses its search box.
export const fetchNowPlaying = async () => {
  const key = envKey("OMDB_API_KEY");

  return {
    source: "omdb",
    movies: [],
    note: key
      ? "Search for a film by title above to schedule it."
      : "OMDB_API_KEY is not set in server/.env.",
  };
};

/** OMDB has no upcoming-releases data; the Coming Soon row hides itself. */
export const fetchUpcoming = async () => [];
