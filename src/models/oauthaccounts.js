import { Schema, model } from "mongoose";

const OAuthAccountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["google", "github", "linkedin"],
    },
    providerAccountId: {
      type: String,
      required: true,
    },
    accessToken: String,
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

// prevent the same OAuth account from being linked twice
OAuthAccountSchema.index(
  { provider: 1, providerAccountId: 1 },
  { unique: true }
);

export default model("OAuthAccount", OAuthAccountSchema);
