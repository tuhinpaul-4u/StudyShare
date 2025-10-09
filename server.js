import express from "express";
import dotenv from "dotenv";

dotenv.config(); // Must be first

import session from "express-session";
import MongoStore from "connect-mongo";
import methodOverride from "method-override";
import path from "path";
import { fileURLToPath } from "url";

// Connect MongoDB
import "./config/db.js";

// Dashboard middleware
import { isAuthenticated } from "./middleware/auth.js";
import Material from "./models/Material.js"; // Make sure you import your Material model

// ✅ Initialize express app
const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set view engine
app.set("view engine", "ejs");           // tells Express to use EJS
app.set("views", path.join(__dirname, "views")); // where your EJS files are

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
//uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

import authRoutes from "./routes/auth.js";
import materialRoutes from "./routes/materials.js";


// Routes
app.use("/", authRoutes);
app.use("/materials", materialRoutes);

// Home route
app.get("/", async (req, res) => {
  try {
    const materials = await Material.find().populate("author");
    res.render("index", { user: req.session.user, materials });
  } catch (err) {
    console.error(err);
    res.render("index", { user: req.session.user, materials: [] });
  }
});

import dashboardRoutes from "./routes/dashboard.js";
app.use("/", dashboardRoutes);
import friendsRoutes from "./routes/friends.js";
app.use("/friends", friendsRoutes);


// Dashboard route
app.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate("friends");

    // User's own materials
    const yourMaterials = await Material.find({ author: user._id });

    // Friends' materials
    const friendsMaterials = await Material.find({ author: { $in: user.friends } }).populate("author");

    res.render("dashboard", { 
      user, 
      yourMaterials, 
      friendsMaterials 
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", { 
      user: req.session.user, 
      yourMaterials: [], 
      friendsMaterials: [] 
    });
  }
});


// Catch-all 404
app.use((req, res) => {
  res.status(404).render("404"); // create a 404.ejs page
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});