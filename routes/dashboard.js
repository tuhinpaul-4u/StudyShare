import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import User from "../models/User.js";
import Material from "../models/Material.js";

const router = express.Router();

// Helper function to fetch dashboard data
async function getDashboardData(userId) {
  const user = await User.findById(userId).populate("friends");

  const yourMaterials = await Material.find({ author: user._id });
  const friendsMaterials = await Material.find({
    author: { $in: user.friends.map(f => f._id) }
  }).populate("author");

  return { user, yourMaterials, friendsMaterials };
}

// Dashboard route
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const { user, yourMaterials, friendsMaterials } = await getDashboardData(req.session.user._id);

    res.render("dashboard", {
      user,
      yourMaterials,
      friendsMaterials,
      friendError: null,
      friendMessage: null
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      user: req.session.user,
      yourMaterials: [],
      friendsMaterials: [],
      friendError: "Failed to load dashboard",
      friendMessage: null
    });
  }
});

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


// Add Friend
router.post("/friends/add", isAuthenticated, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findById(req.session.user._id).populate("friends");
    const friendToAdd = await User.findOne({ email });

    if (!friendToAdd) {
      req.session.friendError = "No user found with that email.";
      return res.redirect("/dashboard");
    }

    if (user.friends.some(f => f._id.equals(friendToAdd._id))) {
      req.session.friendError = "This user is already your friend.";
      return res.redirect("/dashboard");
    }

    user.friends.push(friendToAdd._id);
    await user.save();

    req.session.friendMessage = `Added ${friendToAdd.username} as a friend!`;
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.session.friendError = "Failed to add friend";
    res.redirect("/dashboard");
  }
});

// Remove Friend
router.post("/friends/:id/remove", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.friends = user.friends.filter(fId => fId.toString() !== req.params.id);
    await user.save();

    req.session.friendMessage = "Friend removed successfully.";
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.session.friendError = "Failed to remove friend.";
    res.redirect("/dashboard");
  }
});

export default router;
