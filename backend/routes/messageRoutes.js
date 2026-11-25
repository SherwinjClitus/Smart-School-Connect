const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const {
  sendClassMessage,
  getTeacherMessages,
  getParentMessages,
} = require("../controllers/messageController");

// All message routes require authentication
router.use(authMiddleware);

// Teacher endpoints
router.post("/", authorizeRoles("teacher"), sendClassMessage);

router.get("/teacher", authorizeRoles("teacher"), getTeacherMessages);

// Parent endpoint
router.get("/parent", authorizeRoles("parent"), getParentMessages);

module.exports = router;
