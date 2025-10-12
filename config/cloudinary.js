import express from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ---------------------
// Cloudinary Config
// ---------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------
// Multer Storage Config
// ---------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "StudyShare_uploads",
    allowed_formats: ["jpg", "png", "pdf", "docx", "pptx", "txt"],
  },
});

// ---------------------
// Multer Upload Config
// ---------------------
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ---------------------
// Upload Route
// ---------------------
app.post("/upload", upload.single("file"), (req, res) => {
  // If upload is successful, req.file will contain file info
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  res.json({
    message: "File uploaded successfully!",
    file: req.file,
  });
});

// ---------------------
// Error Handling Middleware
// ---------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 50 MB limit." });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Other errors
    return res.status(500).json({ error: err.message });
  }
  next();
});
