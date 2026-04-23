// server/middleware/uploadMiddleware.js
import multer from "multer";

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

const memoryStorage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const uploadAgencyAvatar = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const uploadTourImage = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const uploadBlogImage = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});