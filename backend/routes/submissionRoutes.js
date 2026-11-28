const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const uploadMiddleware = require("../middleware/uploadMiddleware");
const validateHomeworkFiles = require("../middleware/validateHomeworkFiles");

const {
  submitHomework,
  getStudentSubmissions,
  getHomeworkSubmissions,
  reviewSubmission,
  getChildSubmissions,
  getSubmissionFileAccess,
} = require("../controllers/submissionController");

// Handle Multer errors before passing files to validation
const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Each file must be 10 MB or smaller.",
        });
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "You can upload a maximum of 5 files.",
        });
      }

      return res.status(400).json({
        message: error.message || "File upload failed.",
      });
    }

    next();
  });
};

// Student views their submission history
router.get(
  "/student",
  authMiddleware,
  authorizeRoles("student"),
  getStudentSubmissions,
);

// Student homework submission
router.post(
  "/:homeworkId",
  authMiddleware,
  authorizeRoles("student"),
  handleUpload,
  validateHomeworkFiles,
  submitHomework,
);

// Teacher views submissions for an assignment
router.get(
  "/homework/:homeworkId",
  authMiddleware,
  authorizeRoles("teacher"),
  getHomeworkSubmissions,
);

// Teacher reviews a specific submission attempt
router.patch(
  "/:submissionId/attempt/:attemptNumber/review",
  authMiddleware,
  authorizeRoles("teacher"),
  reviewSubmission,
);

// Parent views a linked child's submissions
router.get(
  "/parent/:childId",
  authMiddleware,
  authorizeRoles("parent"),
  getChildSubmissions,
);
// Authorized user requests temporary access to a submission file
router.get(
  "/:submissionId/attempt/:attemptNumber/file/:fileId",
  authMiddleware,
  authorizeRoles("student", "teacher", "parent"),
  getSubmissionFileAccess,
);

module.exports = router;
