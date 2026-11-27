const validateHomeworkFiles = (req, res, next) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: "Please upload at least one homework file.",
    });
  }

  for (const file of files) {
    const buffer = file.buffer;

    const isJPEG =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    const isPNG =
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const isPDF =
      buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";

    const valid =
      (file.mimetype === "image/jpeg" && isJPEG) ||
      (file.mimetype === "image/png" && isPNG) ||
      (file.mimetype === "application/pdf" && isPDF);

    if (!valid) {
      return res.status(400).json({
        message: `Invalid file content: ${file.originalname}`,
      });
    }
  }

  next();
};

module.exports = validateHomeworkFiles;
