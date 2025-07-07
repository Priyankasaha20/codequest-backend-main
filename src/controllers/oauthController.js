import { db } from "../config/dbPostgres.js";
import { users, oauthAccounts } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { sanitizeUser } from "../services/authService.js";

export const oauthSuccess = (req, res) => {
  if (req.isAuthenticated()) {
    const sanitizedUser = sanitizeUser(req.user);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/auth/success?user=${encodeURIComponent(
        JSON.stringify(sanitizedUser)
      )}`
    );
  } else {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/failure?error=Authentication failed`);
  }
};

export const oauthFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/auth/failure?error=OAuth authentication failed`);
};

export const findOrCreateOAuthUser = async (profile, provider) => {
  try {
    // Find existing OAuth account
    const [oauthAccount] = await db
      .select({
        id: oauthAccounts.id,
        userId: oauthAccounts.userId,
        user: users,
      })
      .from(oauthAccounts)
      .leftJoin(users, eq(oauthAccounts.userId, users.id))
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerId, profile.id)
        )
      );

    if (oauthAccount && oauthAccount.user) {
      return oauthAccount.user;
    }

    const email =
      profile.emails && profile.emails.length > 0
        ? profile.emails[0].value
        : null;

    let user;

    // Check if user exists by email
    if (email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      user = existingUser;
    }

    // Create new user if doesn't exist
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: email || `${provider}_${profile.id}@oauth.local`,
          name: profile.displayName || profile.username || `${provider}_user`,
          avatarUrl:
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : null,
          emailVerified: email ? true : false, // OAuth emails are typically verified
        })
        .returning();
      user = newUser;
    }

    // Create OAuth account
    await db.insert(oauthAccounts).values({
      provider: provider,
      providerId: profile.id,
      providerAccountId: profile.id, // Same as providerId for OAuth accounts
      userId: user.id,
      email: email,
      displayName: profile.displayName || profile.username,
      avatarUrl:
        profile.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : null,
    });

    return user;
  } catch (error) {
    console.error(`Error in findOrCreateOAuthUser for ${provider}:`, error);
    throw error;
  }
};
