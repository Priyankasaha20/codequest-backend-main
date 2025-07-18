import { db } from "../config/dbPostgres.js";
import { profiles } from "../models/postgres/auth.js";
import { eq } from "drizzle-orm";

export const checkProfileAccess = async (req, res, next) => {
  try {
    const profileUserId = parseInt(req.params.userId || req.params.id, 10);

    if (!profileUserId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, profileUserId));

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (!profile.private) {
      return next();
    }

    if (!req.isAuthenticated()) {
      return res
        .status(401)
        .json({ error: "Authentication required for private profile" });
    }

    if (req.user.id !== profileUserId) {
      return res
        .status(403)
        .json({ error: "Access denied to private profile" });
    }

    next();
  } catch (err) {
    console.error("Profile access check error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
