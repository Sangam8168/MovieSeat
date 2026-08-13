import axios from "axios";
import { cached } from "./cache.js";

const IMDB_BASE = "https://imdb236.p.rapidapi.com/api/imdb";
const CAST_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const envKey = (name) => {
  const v = process.env[name];
  if (!v) return undefined;
  const t = String(v).trim();
  return !t || /^your_/i.test(t) || t.startsWith("<") ? undefined : t;
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const asList = (data) => {
  if (Array.isArray(data)) return data;
  for (const k of ["cast", "results", "data", "items", "list"]) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  return [];
};

/**
 * Cast with headshots from imdb236.
 *
 * The endpoint is documented but its response schema is not, so several
 * field spellings are accepted rather than betting on one.
 * Returns [] when no key is set or nothing usable comes back.
 */
export const fetchCast = async (imdbId) => {
  const key = envKey("RAPIDAPI_KEY");
  if (!key || !imdbId) return [];

  const result = await cached(`cast:${imdbId}`, CAST_TTL, async () => {
    try {
      const { data } = await axios.get(`${IMDB_BASE}/${imdbId}/cast`, {
        headers: {
          "x-rapidapi-host": "imdb236.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
        timeout: 10000,
      });

      const people = asList(data)
        .map((p) => {
          const person = p?.person ?? p;
          const name = pick(person, "fullName", "name", "primaryName");
          if (!name) return null;

          const characters = p?.characters ?? person?.characters;
          return {
            name,
            character: Array.isArray(characters)
              ? characters[0] || ""
              : pick(p, "character", "job") || "",
            profile_path:
              pick(person, "primaryImage", "image", "photo", "imageUrl") || "",
          };
        })
        .filter(Boolean)
        .slice(0, 12);

      if (people.length === 0) {
        console.warn(`[imdb236] no cast returned for ${imdbId}`);
        return null;
      }

      const withPhotos = people.filter((p) => p.profile_path).length;
      console.log(
        `[imdb236] cast for ${imdbId}: ${people.length} people, ${withPhotos} with photos`
      );
      return people;
    } catch (error) {
      const reason = error.response?.data?.message || error.message;
      console.warn(`[imdb236] cast lookup failed for ${imdbId}: ${reason}`);
      return null;
    }
  });

  return result || [];
};

export default fetchCast;
