import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import User from "../models/User.js";
import Material from "../models/Material.js";

const router = express.Router();

// Friends page
router.get("/friends", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate("friends");

    res.render("friends", {
      user,
      friendError: null,
      friendMessage: null
    });
  } catch (err) {
    console.error(err);
    res.render("friends", {
      user: req.session.user,
      friendError: "Failed to load friends",
      friendMessage: null
    });
  }
});

// Add a friend
router.post("/friends/add", isAuthenticated, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findById(req.session.user._id).populate("friends");
    const friendToAdd = await User.findOne({ email });

    if (!friendToAdd) {
      return res.render("friends", {
        user,
        friendError: "No user found with that email.",
        friendMessage: null
      });
    }

    if (user.friends.includes(friendToAdd._id)) {
      return res.render("friends", {
        user,
        friendError: "This user is already your friend.",
        friendMessage: null
      });
    }

    user.friends.push(friendToAdd._id);
    await user.save();

    res.render("friends", {
      user,
      friendError: null,
      friendMessage: `Added ${friendToAdd.username} as a friend!`
    });
  } catch (err) {
    console.error(err);
    res.render("friends", {
      user: req.session.user,
      friendError: "Failed to add friend",
      friendMessage: null
    });
  }
});

// Remove a friend
router.post("/friends/:id/remove", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.friends = user.friends.filter(f => f.toString() !== req.params.id);
    await user.save();

    res.redirect("/friends");
  } catch (err) {
    console.error(err);
    res.render("friends", {
      user: req.session.user,
      friendError: "Failed to remove friend",
      friendMessage: null
    });
  }
});

export default router;
