import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

// 🔧 Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer storage configuration (uploads directly to Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "StudyShare_uploads",
    allowed_formats: ["jpg", "png", "pdf", "docx", "pptx", "txt"],
  },
});
//file size 
export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

