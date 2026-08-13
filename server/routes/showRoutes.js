import express from "express";
import {
  addShow,
  getComingSoon,
  getNowPlayingMovies,
  getShow,
  getShows,
  searchMovies,
} from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// Admin - movie discovery for scheduling
showRouter.get("/now-playing", protectAdmin, getNowPlayingMovies);
showRouter.get("/search", protectAdmin, searchMovies);
showRouter.post("/add", protectAdmin, addShow);

// Public
showRouter.get("/all", getShows);
showRouter.get("/coming-soon", getComingSoon);
showRouter.get("/:movieId", getShow);

export default showRouter;
