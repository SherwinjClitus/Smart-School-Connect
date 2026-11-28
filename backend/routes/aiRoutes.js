const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const { askSchoolAI } = require("../controllers/askSchoolAIController");

const {
  improveMessage,
  homeworkSummary,
} = require("../controllers/aiController");

router.use(authMiddleware);

// Teacher: Improve announcement drafts
router.post(
  "/improve-message",
  authorizeRoles("teacher"),
  improveMessage
);

// Student, Parent, Teacher: Homework Assistant
router.post(
  "/homework-summary",
  authorizeRoles("student", "parent", "teacher"),
  homeworkSummary
);

router.post(
  "/chat",
  authorizeRoles("student", "parent", "teacher"),
  askSchoolAI
);

module.exports = router;