import dotenv from "dotenv";
import { Resend } from "resend";
import crypto from "crypto";
import { db } from "../config/dbPostgres.js";
import { verificationTokens } from "../models/postgres/auth.js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(
    Date.now() +
      process.env.VERIFICATION_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000
  );

  await db.insert(verificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  const url = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify your CodeQuest email",
    html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`,
  });
}
