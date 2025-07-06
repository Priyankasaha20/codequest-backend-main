import { Schema, model } from "mongoose";

const VerificationTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

export default model("VerificationToken", VerificationTokenSchema);
