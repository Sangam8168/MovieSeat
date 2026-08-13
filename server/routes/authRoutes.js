import express from "express";
import { getMe, login, register, googleAuth } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.get("/me", protect, getMe);

export default authRouter;
