// Vercel turns files in api/ into serverless functions automatically.
// vercel.json rewrites every path here, so Express handles its own routing.
import app from "../server.js";

export default app;
