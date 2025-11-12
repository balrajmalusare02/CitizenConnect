/*
 * Cloudinary Configuration
 * Location: src/config/cloudinaryConfig.ts
 * Purpose: Setup Cloudinary for media uploads
 */

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "citizenconnect/complaints",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4", "mov", "avi", "webp"],
      resource_type: file.mimetype.startsWith("video") ? "video" : "image",
      public_id: `complaint-${Date.now()}`,
    };
  },
});

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {

  //console.log("FILE MIME TYPE RECEIVED:", file.mimetype);
  // Allow images and videos only
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "application/octet-stream",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
  }
};

// Multer upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export default cloudinary;