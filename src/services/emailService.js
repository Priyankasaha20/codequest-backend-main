import dotenv from "dotenv";
import { Resend } from "resend";
import crypto from "crypto";
import VerificationToken from "../models/verificationToken.js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM;
const VERIFICATION_URL_BASE = process.env.VERIFICATION_URL_BASE;
const TOKEN_EXPIRATION_HOURS =
  process.env.VERIFICATION_TOKEN_EXPIRATION_HOURS || 24;

export async function sendVerificationEmail(user) {
  // generate one-time token
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000
  );

  // store token in database
  await VerificationToken.create({ user: user._id, token, expiresAt });

  const url = `${VERIFICATION_URL_BASE}/verify?token=${token}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: "Verify your CodeQuest email",
    html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`,
  });
}

// one-time token verification handled in controller; no JWT used
