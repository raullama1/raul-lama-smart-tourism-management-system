// server/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function uploadBufferToCloudinary(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(upload);
  });
}

export function extractPublicIdFromCloudinaryUrl(url) {
  try {
    if (!url || !url.includes("res.cloudinary.com")) return null;

    const parts = url.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return null;

    const pathParts = parts.slice(uploadIndex + 1);

    if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
      pathParts.shift();
    }

    const joined = pathParts.join("/");
    return joined.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImageByUrl(url) {
  const publicId = extractPublicIdFromCloudinaryUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error("Cloudinary delete error", err);
  }
}