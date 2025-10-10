import express from "express";
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import methodOverride from "method-override";

// Models
import User from "./models/User.js";
import Material from "./models/Material.js";

// DB
import "./config/db.js";

// Middleware
import { isAuthenticated } from "./middleware/auth.js";

// Routes
import authRoutes from "./routes/auth.js";
import materialRoutes from "./routes/materials.js";
import dashboardRoutes from "./routes/dashboard.js";
import friendsRoutes from "./routes/friends.js";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
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

// Routes
app.use("/", authRoutes);
app.use("/materials", materialRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/friends", friendsRoutes);

// Home route (guest view)
app.get("/", async (req, res) => {
  try {
    if (req.session.user) return res.redirect("/dashboard");

    const materials = await Material.find().populate("author");
    res.render("index", { user: null, materials });
  } catch (err) {
    console.error(err);
    res.render("index", { user: null, materials: [] });
  }
});

// Catch-all 404
app.use((req, res) => res.status(404).render("404"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
