import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Emails listed here are promoted to admin the first time they sign up
const isAdminEmail = (email) =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());

// Applies ADMIN_EMAILS to an existing account at sign-in. Promotion only.
const syncAdminRole = async (user) => {
  if (user.role !== "admin" && isAdminEmail(user.email)) {
    user.role = "admin";
    await user.save();
    console.log(`Promoted ${user.email} to admin (listed in ADMIN_EMAILS)`);
  }
  return user;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// API Controller Function to Register a New User
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.json({ success: false, message: "Email is already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: isAdminEmail(email) ? "admin" : "user",
    });

    const token = signToken(user._id);

    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Login an Existing User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required",
      });
    }

    // password is select:false on the schema, so request it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // Account was created through Google and has no password set
    if (!user.password) {
      return res.json({
        success: false,
        message: "This account uses Google Sign-In. Continue with Google instead.",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    await syncAdminRole(user);

    const token = signToken(user._id);

    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Login/Register via Google Sign-In.
// Receives the ID token ("credential") issued by Google Identity Services
// on the client, verifies it against Google, then issues our own JWT.
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.json({ success: false, message: "Missing Google credential" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.json({
        success: false,
        message: "Google Sign-In is not configured on the server",
      });
    }

    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      console.error(
        "GOOGLE_CLIENT_ID is not a valid client ID." +
          (clientId.startsWith("GOCSPX-")
            ? " It looks like a client SECRET - use the client ID instead."
            : "")
      );
      return res.json({
        success: false,
        message: "Google Sign-In is misconfigured on the server",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      return res.json({
        success: false,
        message: "Google account email is not verified",
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Link an existing local account to Google
      let changed = false;

      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (!user.image && picture) {
        user.image = picture;
        changed = true;
      }
      if (changed) await user.save();
      await syncAdminRole(user);
    } else {
      user = await User.create({
        googleId,
        email,
        name: name || email.split("@")[0],
        image: picture || "",
        role: isAdminEmail(email) ? "admin" : "user",
      });
    }

    const token = signToken(user._id);

    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: "Google sign-in failed" });
  }
};

// API Controller Function to Get the Currently Logged-in User
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};
