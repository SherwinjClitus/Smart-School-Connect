const multer = require("multer");
const path = require("path");

const allowedTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = allowedTypes[file.mimetype];

  if (!validExtensions || !validExtensions.includes(extension)) {
    return callback(
      new Error("Only JPG, JPEG, PNG and PDF files are allowed."),
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5,
  },
});

const uploadHomeworkFiles = upload.array("files", 5);

module.exports = uploadHomeworkFiles;
