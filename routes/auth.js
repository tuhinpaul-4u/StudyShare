import express from "express";
import crypto from "crypto";
import User from "../models/User.js";

const router = express.Router();

/* -------------------------------
   REGISTER
--------------------------------- */
router.get("/register", (req, res) => {
  res.render("register", { error: null, message: null });
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { error: "Email already in use", message: null });
    }

    if (email === process.env.ADMIN_EMAIL) {
      const adminUser = new User({
        username,
        email,
        password,
        isVerified: true,
        isAdmin: true,
      });

      await adminUser.save();
      req.session.user = adminUser;
      return res.redirect("/");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = new User({
      username,
      email,
      password,
      verificationToken,
    });
    await newUser.save();

    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email
    )}&su=${encodeURIComponent("StudyTogether Verification")}&body=${encodeURIComponent(
      `Hello ${username},\n\nClick the link below to verify your account:\nhttp://localhost:3000/verify/${verificationToken}`
    )}`;

    res.render("register", {
      error: null,
      message: `Please verify your email before logging in. Click <a href="${gmailLink}" target="_blank">here</a> to open Gmail and send yourself the verification link.`,
    });
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Something went wrong", message: null });
  }
});

/* -------------------------------
   VERIFY EMAIL
--------------------------------- */
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.send("Invalid or expired verification link.");

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("✅ Email verified successfully! You can now log in.");
  } catch (err) {
    console.error(err);
    res.send("Error verifying email.");
  }
});

/* -------------------------------
   LOGIN
--------------------------------- */
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "No account found with that email." });
    }

    if (!user.isVerified && !user.isAdmin) {
      return res.render("login", { error: "Please verify your email before logging in." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("login", { error: "Incorrect password." });
    }

    req.session.user = user;
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Something went wrong. Please try again." });
  }
});

/* -------------------------------
   LOGOUT
--------------------------------- */
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* -------------------------------
   FORGOT PASSWORD (placeholder)
--------------------------------- */
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    message: "🔧 Password reset feature is under development. Stay tuned for future updates!",
  });
});

router.post("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    message: "🔧 Password reset feature is under development. Stay tuned for future updates!",
  });
});

export default router;
