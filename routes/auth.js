import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

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

    // ✅ Admin auto-verified
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
      return res.redirect("/dashboard");
    }

    // ✅ Create verification token and user
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = new User({
      username,
      email,
      password,
      verificationToken,
      isVerified: false,
    });
    await newUser.save();

    // ✅ Send email using your email.js utility
    
    const verifyLink = `${process.env.BASE_URL}/verify/${verificationToken}`;
    await sendEmail(email, "Verify your StudyShare account",
    `<p>Hi ${username},</p>
    <p>Click to verify: <a href="${verifyLink}">${verifyLink}</a></p>`
    );


    // ✅ Inform the user to check their email
    res.render("register", {
      error: null,
      message: `Verification email sent to <b>${email}</b>. Please check your inbox (and spam folder).`,
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
    if (!user) {
      return res.render("login", { error: "Invalid or expired verification link." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.render("login", { error: null, message: "✅ Email verified successfully! You can now log in." });
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Error verifying email. Please try again later.", message: null });
  }
});

/* -------------------------------
   LOGIN
--------------------------------- */
router.get("/login", (req, res) => {
  res.render("login", { error: null, message: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "No account found with that email.", message: null });
    }

    if (!user.isVerified && !user.isAdmin) {
      return res.render("login", { error: "Please verify your email before logging in.", message: null });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("login", { error: "Incorrect password.", message: null });
    }

    req.session.user = user;
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Something went wrong. Please try again.", message: null });
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
