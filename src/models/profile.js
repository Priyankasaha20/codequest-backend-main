import { Schema, model, Types } from "mongoose";

const ProfileSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    academicYear: {
      type: String,
      trim: true,
      default: "",
    },
    institute: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default model("Profile", ProfileSchema);
