import User from "../models/user.js";
import OAuthAccount from "../models/oauthaccounts.js";
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
    const oauthAccount = await OAuthAccount.findOne({
      provider: provider,
      providerId: profile.id,
    }).populate("userId");

    if (oauthAccount && oauthAccount.userId) {
      return oauthAccount.userId;
    }

    const email =
      profile.emails && profile.emails.length > 0
        ? profile.emails[0].value
        : null;

    let user;

    if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({
        email: email || `${provider}_${profile.id}@oauth.local`,
        name: profile.displayName || profile.username || `${provider}_user`,
        avatarUrl:
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : null,
        emailVerified: email ? true : false, // OAuth emails are typically verified
      });
      await user.save();
    }

    const newOAuthAccount = new OAuthAccount({
      provider: provider,
      providerId: profile.id,
      providerAccountId: profile.id, // Same as providerId for OAuth accounts
      userId: user._id,
      email: email,
      displayName: profile.displayName || profile.username,
      avatarUrl:
        profile.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : null,
    });
    await newOAuthAccount.save();

    return user;
  } catch (error) {
    console.error(`Error in findOrCreateOAuthUser for ${provider}:`, error);
    throw error;
  }
};
