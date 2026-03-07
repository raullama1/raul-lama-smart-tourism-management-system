// server/middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Avatars
const avatarsDir = path.join(process.cwd(), "server", "uploads", "avatars");
fs.mkdirSync(avatarsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },

  filename: (req, file, cb) => {
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

const agencyAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },

  filename: (req, file, cb) => {
    if (!req.user?.id) {
      return cb(new Error("Unauthorized upload attempt"));
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
      ? ext
      : ".jpg";

    const filename = `ag${req.user.id}-${Date.now()}${safeExt}`;
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
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const uploadAgencyAvatar = multer({
  storage: agencyAvatarStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// Tours
const toursDir = path.join(process.cwd(), "server", "uploads", "tours");
fs.mkdirSync(toursDir, { recursive: true });

const tourStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, toursDir),
  filename: (req, file, cb) => {
    if (!req.user?.id) return cb(new Error("Unauthorized upload attempt"));

    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
      ? ext
      : ".jpg";

    const filename = `a${req.user.id}-${Date.now()}${safeExt}`;
    cb(null, filename);
  },
});

export const uploadTourImage = multer({
  storage: tourStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// Blogs
const blogsDir = path.join(process.cwd(), "server", "uploads", "blogs");
fs.mkdirSync(blogsDir, { recursive: true });

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, blogsDir),
  filename: (req, file, cb) => {
    if (!req.user?.id) return cb(new Error("Unauthorized upload attempt"));

    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
      ? ext
      : ".jpg";

    const filename = `b${req.user.id}-${Date.now()}${safeExt}`;
    cb(null, filename);
  },
});

export const uploadBlogImage = multer({
  storage: blogStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});