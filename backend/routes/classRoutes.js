
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const {
  createClass,
  addStudentToClass,
  getMyClasses,
} = require("../controllers/classController");

// All class routes require teacher authentication
router.use(authMiddleware, authorizeRoles("teacher"));

router.post("/", createClass);

router.get("/my-classes", getMyClasses);

router.post("/:classId/students", addStudentToClass);

module.exports = router;
