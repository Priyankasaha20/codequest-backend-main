export const isSelf =
  (paramName = "userId") =>
  (req, res, next) => {
    const requestedId = req.params[paramName];
    if (req.isAuthenticated() && req.user.id === requestedId) return next();
    return res.status(403).json({ error: "Forbidden: Access denied" });
  };
