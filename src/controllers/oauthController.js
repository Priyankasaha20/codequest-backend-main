import User from "../models/user.js";
import OAuthAccount from "../models/oauthaccounts.js";
import { sanitizeUser } from "../services/authService.js";

// OAuth success callback - handles both Google and GitHub OAuth success
export const oauthSuccess = (req, res) => {
  if (req.isAuthenticated()) {
    const sanitizedUser = sanitizeUser(req.user);

    // Redirect to frontend with success message
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

// OAuth failure callback
export const oauthFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/auth/failure?error=OAuth authentication failed`);
};

// Helper function to find or create user from OAuth profile
export const findOrCreateOAuthUser = async (profile, provider) => {
  try {
    // Check if OAuth account already exists
    const oauthAccount = await OAuthAccount.findOne({
      provider: provider,
      providerId: profile.id,
    }).populate("userId");

    if (oauthAccount && oauthAccount.userId) {
      return oauthAccount.userId;
    }

    // Extract email from profile
    const email =
      profile.emails && profile.emails.length > 0
        ? profile.emails[0].value
        : null;

    let user;

    if (email) {
      // Check if user exists with this email
      user = await User.findOne({ email });
    }

    if (!user) {
      // Create new user
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

    // Create OAuth account link
    const newOAuthAccount = new OAuthAccount({
      provider: provider,
      providerId: profile.id,
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
