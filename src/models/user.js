import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    name: String,
    avatarUrl: String,
  },
  {
    timestamps: true,
  }
);


UserSchema.index({ email: 1 }, { unique: true });

export default model("User", UserSchema);
