import axios from "axios";
import { cached } from "./cache.js";

const YT_SEARCH = "https://www.googleapis.com/youtube/v3/search";
const TRAILER_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const envKey = (name) => {
  const v = process.env[name];
  if (!v) return undefined;
  const t = String(v).trim();
  return !t || /^your_/i.test(t) || t.startsWith("<") ? undefined : t;
};

// Uploads that match a movie title but are not the trailer
const REJECT = /reaction|review|breakdown|explained|recap|ending|easter egg|fan[- ]?made|concept|parody|spoof|full movie|in hindi dubbed movie/i;

// Scores a search result so the official trailer wins over clips and teasers
const scoreResult = (item, title, year) => {
  const vidTitle = (item.snippet?.title || "").toLowerCase();
  const channel = (item.snippet?.channelTitle || "").toLowerCase();
  const wanted = title.toLowerCase();

  if (REJECT.test(vidTitle)) return -1;

  let score = 0;
  if (vidTitle.includes("official trailer")) score += 5;
  else if (vidTitle.includes("trailer")) score += 3;
  else if (vidTitle.includes("teaser")) score += 2;

  if (vidTitle.includes(wanted)) score += 3;
  if (year && vidTitle.includes(String(year))) score += 1;

  // Studio channels are the most reliable source
  if (/pictures|studios|movies|entertainment|films|marvel|warner|universal|sony|paramount|netflix|prime video/.test(channel)) {
    score += 2;
  }

  return score;
};

/**
 * Finds a YouTube video id for a movie's trailer.
 * Returns null when no key is configured or nothing suitable is found.
 */
export const findTrailerId = async (title, yearish) => {
  const key = envKey("YOUTUBE_API_KEY");

  if (!key) {
    console.warn("[youtube] YOUTUBE_API_KEY not set - skipping trailer lookup");
    return null;
  }
  if (!title) return null;

  // Callers pass either "2017" or a full date like "05 May 2017"
  const year = String(yearish || "").match(/\d{4}/)?.[0] || "";

  const cacheKey = `trailer:${title.toLowerCase()}:${year}`;

  const id = await cached(cacheKey, TRAILER_TTL, async () => {
    try {
      const { data } = await axios.get(YT_SEARCH, {
        params: {
          key,
          q: `${title} ${year || ""} official trailer`.trim(),
          part: "snippet",
          type: "video",
          videoEmbeddable: "true",
          maxResults: 8,
          safeSearch: "strict",
        },
        timeout: 10000,
      });

      const items = Array.isArray(data?.items) ? data.items : [];
      if (items.length === 0) {
        console.warn(`[youtube] search returned no results for "${title}"`);
        return null;
      }

      const best = items
        .map((item) => ({ item, score: scoreResult(item, title, year) }))
        .filter((r) => r.score >= 0)
        .sort((a, b) => b.score - a.score)[0];

      if (!best) {
        console.warn(`[youtube] no suitable trailer found for "${title}"`);
        return null;
      }

      console.log(
        `[youtube] trailer for "${title}": ${best.item.id.videoId} - ${best.item.snippet.title}`
      );
      return best.item.id.videoId || null;
    } catch (error) {
      const reason = error.response?.data?.error?.message || error.message;
      console.warn(`[youtube] trailer lookup failed for "${title}": ${reason}`);
      return null;
    }
  });

  return id || null;
};

// Extracts a video id from any common YouTube URL, or accepts a bare id.
export const parseYoutubeId = (input) => {
  if (!input) return null;
  const value = String(input).trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }
  return null;
};

export default findTrailerId;
