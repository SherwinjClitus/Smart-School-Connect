const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const { randomUUID } = require("crypto");
const path = require("path");

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const isPDF = file.mimetype === "application/pdf";

    const resourceType = isPDF ? "raw" : "image";
    const deliveryType = "authenticated";

    const extension = path.extname(file.originalname).toLowerCase();

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);

    const publicId = isPDF
      ? `${randomUUID()}-${safeName}${extension}`
      : `${randomUUID()}-${safeName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-school-connect/homework",
        resource_type: resourceType,
        type: deliveryType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          originalName: file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          format: extension.replace(".", ""),
          resourceType,
          deliveryType,
          size: file.size,
        });
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (file) => {
  return cloudinary.uploader.destroy(file.publicId, {
    resource_type: file.resourceType,
    type: file.deliveryType || "upload",
  });
};

const uploadHomeworkFiles = async (files) => {
  const uploadedFiles = [];

  try {
    for (const file of files) {
      const uploadedFile = await uploadToCloudinary(file);
      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  } catch (error) {
    await Promise.allSettled(
      uploadedFiles.map((file) => deleteFromCloudinary(file)),
    );

    throw error;
  }
};
const generatePrivateFileUrl = (file) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;

  return cloudinary.utils.private_download_url(file.publicId, file.format, {
    resource_type: file.resourceType,
    type: file.deliveryType,
    expires_at: expiresAt,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadHomeworkFiles,
  generatePrivateFileUrl,
};
