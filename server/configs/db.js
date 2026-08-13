import mongoose from "mongoose";

const DB_NAME = "showtime";

// Inserts the database name before any query string in the connection URI.
export const buildMongoUri = (raw, dbName = DB_NAME) => {
  if (!raw) {
    throw new Error("MONGODB_URI is missing - add it to server/.env");
  }

  const [base, ...queryParts] = raw.trim().split("?");
  const query = queryParts.join("?");
  const host = base.replace(/\/+$/, "");

  // Does the URI already specify a database after the host?
  const hasDb = /^mongodb(\+srv)?:\/\/[^/]+\/.+/.test(host);
  const withDb = hasDb ? host : `${host}/${dbName}`;

  return query ? `${withDb}?${query}` : withDb;
};

// Serverless functions reuse the process between invocations, so the
// connection is cached on globalThis to avoid opening a new pool per request.
const cache = globalThis._mongoose ?? (globalThis._mongoose = {
  conn: null,
  promise: null,
});

const connectDB = async () => {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const uri = buildMongoUri(process.env.MONGODB_URI);

    mongoose.connection.on("connected", () =>
      console.log(`Database connected (db: ${mongoose.connection.name})`)
    );
    mongoose.connection.on("error", (err) =>
      console.error("MongoDB error:", err.message)
    );

    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 15000,
        // Keep the pool small; serverless spreads load across many instances
        maxPoolSize: 10,
      })
      .catch((error) => {
        cache.promise = null; // let the next request retry
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

export default connectDB;
