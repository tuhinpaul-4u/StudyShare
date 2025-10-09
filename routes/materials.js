import express from "express";
import Material from "../models/Material.js";
import User from "../models/User.js";
import { isAuthenticated } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js"; // ✅ Cloudinary-based multer

const router = express.Router();

// Show your materials + friends' materials
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate("friends");

    const materials = await Material.find({
      author: { $in: [user._id, ...user.friends] },
    }).populate("author");

    res.render("materials/index", { materials, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.render("materials/index", { materials: [], user: req.session.user });
  }
});

// Form to add new material
router.get("/new", isAuthenticated, (req, res) => {
  res.render("materials/new", { error: null });
});

// ✅ Create new material with Cloudinary file upload
router.post("/", isAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;

    // ✅ Cloudinary returns a hosted file URL in req.file.path
    const fileUrl = req.file ? req.file.path : null;

    await Material.create({
      title,
      description,
      fileUrl,
      author: req.session.user._id,
    });

    res.redirect("/materials");
  } catch (err) {
    console.error(err);
    res.render("materials/new", { error: "Error creating material" });
  }
});

// Edit material form
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.redirect("/materials");
    if (!material.author.equals(req.session.user._id))
      return res.send("Unauthorized");
    res.render("materials/edit", { material, error: null });
  } catch (err) {
    console.error(err);
    res.redirect("/materials");
  }
});

// ✅ Update material with optional Cloudinary reupload
router.put("/:id", isAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.redirect("/materials");
    if (!material.author.equals(req.session.user._id))
      return res.send("Unauthorized");

    const { title, description } = req.body;
    material.title = title;
    material.description = description;

    // ✅ Update file if a new one was uploaded
    if (req.file) {
      material.fileUrl = req.file.path;
    }

    await material.save();
    res.redirect("/materials");
  } catch (err) {
    console.error(err);
    const material = await Material.findById(req.params.id);
    res.render("materials/edit", { material, error: "Error updating material" });
  }
});

// Delete material
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.redirect("/materials");
    if (!material.author.equals(req.session.user._id))
      return res.send("Unauthorized");

    await Material.findByIdAndDelete(req.params.id);
    res.redirect("/materials");
  } catch (err) {
    console.error(err);
    res.redirect("/materials");
  }
});

export default router;
