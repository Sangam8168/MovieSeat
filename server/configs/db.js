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

const connectDB = async () => {
  const uri = buildMongoUri(process.env.MONGODB_URI);

  mongoose.connection.on("connected", () =>
    console.log(`✅ Database connected (db: ${mongoose.connection.name})`)
  );
  mongoose.connection.on("error", (err) =>
    console.error("❌ MongoDB error:", err.message)
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("⚠️  MongoDB disconnected")
  );

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (error) {
    console.error("\n❌ Could not connect to MongoDB.");
    console.error("   Reason:", error.message);
    console.error("\n   Common causes:");
    console.error("   • Your current IP is not on the Atlas Network Access allowlist");
    console.error("   • Wrong username/password in MONGODB_URI");
    console.error("   • MONGODB_URI missing or malformed in server/.env\n");
    process.exit(1);
  }
};

export default connectDB;
