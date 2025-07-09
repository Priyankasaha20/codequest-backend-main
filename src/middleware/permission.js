export const isSelf =
  (paramName = "userId") =>
  (req, res, next) => {
    const requestedId = req.params[paramName];

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.user.emailVerified) {
      return res.status(401).json({ error: "Email verification required" });
    }

    if (req.user.id === parseInt(requestedId)) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden: Access denied" });
  };
