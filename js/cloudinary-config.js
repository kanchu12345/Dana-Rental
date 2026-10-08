// Cloudinary Configuration placeholder
// Replace with your Cloudinary Cloud Name and Unsigned Upload Preset
export const cloudinaryConfig = {
  cloudName: "ygkhhyaj",
  uploadPreset: "YOUR_CLOUDINARY_UNSIGNED_PRESET"
};

export function isCloudinaryConfigured() {
  return cloudinaryConfig.cloudName && 
         cloudinaryConfig.cloudName !== "YOUR_CLOUDINARY_CLOUD_NAME" &&
         cloudinaryConfig.uploadPreset &&
         cloudinaryConfig.uploadPreset !== "YOUR_CLOUDINARY_UNSIGNED_PRESET";
}
