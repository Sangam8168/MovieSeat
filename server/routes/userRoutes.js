import express from "express";
import { getFavorites, getUserBookings, updateFavorite } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.get("/bookings", protect, getUserBookings);
userRouter.post("/update-favorite", protect, updateFavorite);
userRouter.get("/favorites", protect, getFavorites);

export default userRouter;
