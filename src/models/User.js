import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    defaultWorkspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    preferences: {
      locale: { type: String, default: "en-US" },
      timezone: { type: String, default: "UTC" },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
