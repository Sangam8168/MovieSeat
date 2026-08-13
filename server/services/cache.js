import mongoose from "mongoose";
import ApiCache from "../models/ApiCache.js";

// Two-layer cache: an in-process Map in front of a MongoDB collection,
// so cached responses survive server restarts. Falls back to memory only
// when the database is unavailable.

const memory = new Map();

const dbReady = () => mongoose.connection.readyState === 1;

export const cacheGet = async (key) => {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (hit) memory.delete(key);

  if (!dbReady()) return null;

  try {
    const doc = await ApiCache.findById(key).lean();
    if (!doc) return null;

    if (new Date(doc.expiresAt).getTime() <= Date.now()) {
      await ApiCache.deleteOne({ _id: key }).catch(() => {});
      return null;
    }

    memory.set(key, {
      value: doc.value,
      expiresAt: new Date(doc.expiresAt).getTime(),
    });
    return doc.value;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlMs) => {
  const expiresAt = new Date(Date.now() + ttlMs);
  memory.set(key, { value, expiresAt: expiresAt.getTime() });

  if (!dbReady()) return;

  try {
    await ApiCache.findByIdAndUpdate(
      key,
      { value, expiresAt },
      { upsert: true }
    );
  } catch {
    /* never let a cache write break a request */
  }
};

export const cacheClear = async () => {
  memory.clear();
  if (dbReady()) await ApiCache.deleteMany({}).catch(() => {});
};

/** Wraps a fetcher so it only runs on a cache miss. */
export const cached = async (key, ttlMs, fetcher) => {
  const hit = await cacheGet(key);
  if (hit !== null && hit !== undefined) return hit;

  const value = await fetcher();
  if (value !== null && value !== undefined) await cacheSet(key, value, ttlMs);
  return value;
};
