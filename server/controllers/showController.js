import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { sendEvent } from "../inngest/index.js";
import { findTrailerId, parseYoutubeId } from "../services/youtube.js";
import {
  fetchMovieDetails,
  fetchNowPlaying,
  fetchUpcoming,
  searchMovies as searchMovieSource,
} from "../services/movieSource.js";



// OMDB has no box-office endpoint, so the admin picker uses search instead.
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { movies, source, note } = await fetchNowPlaying();
    res.json({ success: true, movies, source, note });
  } catch (error) {
    console.error("getNowPlayingMovies:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to search any movie by title
export const searchMovies = async (req, res) => {
  try {
    const query = (req.query.query || "").trim();

    if (query.length < 2) {
      return res.json({ success: true, movies: [] });
    }

    const movies = await searchMovieSource(query);
    res.json({ success: true, movies });
  } catch (error) {
    console.error("searchMovies:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// API for the "Coming Soon" row
export const getComingSoon = async (req, res) => {
  try {
    const upcoming = await fetchUpcoming(req.query.country);

    // Anything already scheduled belongs in "Now Showing"
    const scheduled = await Show.find({
      showDateTime: { $gte: new Date() },
    }).distinct("movie");

    const scheduledIds = new Set(scheduled.map(String));
    const movies = upcoming.filter((m) => !scheduledIds.has(String(m._id)));

    res.json({ success: true, movies });
  } catch (error) {
    console.error("getComingSoon:", error.message);
    res.json({ success: false, message: error.message });
  }
};


// API to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice, trailerUrl } = req.body;

    // Stripe rejects charges converting to under ~$0.50
    const minPrice = Number(process.env.MIN_SHOW_PRICE) || 50;
    if (Number(showPrice) < minPrice) {
      return res.json({
        success: false,
        message: `Show price must be at least ${minPrice} - payments below this are rejected by Stripe.`,
      });
    }

    // A pasted URL always wins over the automatic lookup
    const manualTrailerId = parseYoutubeId(trailerUrl);

    let movie = await Movie.findById(movieId);

    if (!movie) {
      const details = await fetchMovieDetails(movieId);

      if (!details) {
        return res.json({
          success: false,
          message: "Could not fetch details for that movie",
        });
      }

      const trailerId =
        manualTrailerId || (await findTrailerId(details.title, details.year));

      movie = await Movie.create({
        ...details,
        _id: movieId,
        trailer_video_id: trailerId || "",
      });
    } else if (manualTrailerId && movie.trailer_video_id !== manualTrailerId) {
      // Movie already exists - let the admin correct or set its trailer
      movie.trailer_video_id = manualTrailerId;
      await movie.save();
    }

    const showsToCreate = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {}, // Initialize with empty object
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    await sendEvent({
      name: "app/show.added",
      data: { movieTitle: movie.title },
    });

    res.json({ success: true, message: "Show Added successfully." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows from the database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Dedupe by movie id
    const uniqueShows = Array.from(
      new Map(
        shows
          .filter((show) => show.movie)
          .map((show) => [String(show.movie._id), show.movie])
      ).values()
    );

    res.json({ success: true, shows: uniqueShows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get a single show from the database
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);

    // Backfill the trailer for movies saved before this field existed
    if (movie && !movie.trailer_video_id) {
      const trailerId = await findTrailerId(movie.title, movie.release_date);
      if (trailerId) {
        movie.trailer_video_id = trailerId;
        await movie.save();
      }
    }

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
