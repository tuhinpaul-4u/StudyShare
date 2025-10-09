// middleware/auth.js
export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  // User is not logged in
  res.redirect("/login");
};
