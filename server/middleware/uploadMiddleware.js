// server/middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Absolute path: /server/uploads/avatars
const uploadDir = path.join(process.cwd(), "server", "uploads", "avatars");

// Ensure directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Safety check (should never happen if authMiddleware runs)
    if (!req.user?.id) {
      return cb(new Error("Unauthorized upload attempt"));
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
      ? ext
      : ".jpg";

    const filename = `u${req.user.id}-${Date.now()}${safeExt}`;
    cb(null, filename);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PNG, JPG, JPEG, and WEBP images are allowed"));
  }

  cb(null, true);
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});
