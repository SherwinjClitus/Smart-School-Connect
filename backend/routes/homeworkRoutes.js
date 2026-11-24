const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const {
  createHomework,
  getTeacherHomework,
  getStudentHomework,
  completeHomework,
  getChildHomework,
  getParentHomework,
} = require("../controllers/homeworkController");

// Teacher routes
router.post("/", authMiddleware, authorizeRoles("teacher"), createHomework);

router.get(
  "/teacher",
  authMiddleware,
  authorizeRoles("teacher"),
  getTeacherHomework,
);

// Student routes
router.get(
  "/student",
  authMiddleware,
  authorizeRoles("student"),
  getStudentHomework,
);

router.patch(
  "/:homeworkId/complete",
  authMiddleware,
  authorizeRoles("student"),
  completeHomework,
);

// Parent route
router.get(
  "/parent",
  authMiddleware,
  authorizeRoles("parent"),
  getParentHomework
);

router.get(
  "/child/:childId",
  authMiddleware,
  authorizeRoles("parent"),
  getChildHomework,
);

module.exports = router;
