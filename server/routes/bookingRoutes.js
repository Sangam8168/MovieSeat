import express from "express";
import {
  confirmBooking,
  createBooking,
  getOccupiedSeats,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", protect, createBooking);
bookingRouter.get("/seats/:showId", getOccupiedSeats);
bookingRouter.get("/confirm/:sessionId", protect, confirmBooking);

export default bookingRouter;
