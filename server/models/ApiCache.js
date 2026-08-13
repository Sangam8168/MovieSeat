import mongoose from "mongoose";

// Persistent cache for third-party API responses.
// The TTL index removes documents once expiresAt passes.
const apiCacheSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false }
);

const ApiCache = mongoose.model("ApiCache", apiCacheSchema);

export default ApiCache;
