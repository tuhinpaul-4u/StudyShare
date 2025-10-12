import express from "express";
import Material from "../models/Material.js";
import User from "../models/User.js";
import { isAuthenticated } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js"; // Multer configured for Cloudinary

const router = express.Router();

// Show all materials (Dashboard view uses different variables)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate("friends");

    const materials = await Material.find({
      author: { $in: [user._id, ...user.friends] },
    }).populate("author");

    // Pull flash message from session
    const materialMessage = req.session.materialMessage || null;
    req.session.materialMessage = null;

    res.render("materials/index", { materials, user: req.session.user, materialMessage });
  } catch (err) {
    console.error(err);
    res.render("materials/index", { materials: [], user: req.session.user, materialMessage: null });
  }
});

// Form to add new material
router.get("/new", isAuthenticated, (req, res) => {
  res.render("materials/new", { 
    material: {}, 
    editMode: false, 
    error: null 
  });
});


// Upload new material
router.post("/", isAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const newMaterial = new Material({
      title: req.body.title,
      description: req.body.description,
      author: req.session.user._id,
      fileUrl: req.file ? req.file.path : null,
    });

    await newMaterial.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error adding material:", err);
    res.render("materials/new", { 
      material: req.body, 
      editMode: false, 
      error: "Error uploading material. Please try again." 
    });
  }
});


// Edit material page — reuse upload form
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.redirect("/dashboard");

    // Only allow owner to edit
    if (!material.author.equals(req.session.user._id)) {
      return res.send("Unauthorized");
    }

    res.render("materials/new", { 
      material, 
      editMode: true, 
      error: null 
    });
  } catch (err) {
    console.error("Error loading edit page:", err);
    res.redirect("/dashboard");
  }
});


// Update material
router.put("/:id", isAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) return res.redirect("/dashboard");
    if (!material.author.equals(req.session.user._id)) return res.send("Unauthorized");

    // Update title and description
    material.title = req.body.title;
    material.description = req.body.description;

    // Only replace file if user uploaded a new one
    if (req.file) {
      material.fileUrl = req.file.path;
    }

    await material.save();

    // Optional success message
    req.session.materialMessage = "✅ Material updated successfully!";
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error updating material:", err);
    res.render("materials/new", { 
      material: req.body, 
      editMode: true, 
      error: "Error updating material. Please try again." 
    });
  }
});


// Delete material
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.redirect("/materials");
    if (!material.author.equals(req.session.user._id)) return res.send("Unauthorized");

    await Material.findByIdAndDelete(req.params.id);

    req.session.materialMessage = "Material deleted successfully!"; // ✅ add flash
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.redirect("/materials");
  }
});


export default router;
