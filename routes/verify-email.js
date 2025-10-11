router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ verificationToken: token });
  if (!user) return res.render("error", { message: "Invalid token" });

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.render("verified", { username: user.username });
});
