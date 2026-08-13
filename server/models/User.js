import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Excluded from queries by default; opt in with .select("+password")
    password: { type: String, minlength: 6, select: false },
    googleId: { type: String, unique: true, sparse: true },
    image: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    favorites: [{ type: String, ref: "Movie" }],
  },
  { timestamps: true }
);

// Hash the password whenever it is created/changed
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plaintext password against the stored hash
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields before sending the user back to the client
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    image: this.image,
    role: this.role,
    favorites: this.favorites,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
