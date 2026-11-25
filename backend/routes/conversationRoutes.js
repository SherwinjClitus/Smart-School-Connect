
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const {
  createConversation,
  getMyConversations,
  getConversationMessages,
  sendConversationMessage,
  updateConversationStatus,
} = require("../controllers/conversationController");

router.use(authMiddleware);

router.post(
  "/",
  authorizeRoles("parent", "teacher"),
  createConversation
);

router.get(
  "/",
  authorizeRoles("parent", "teacher"),
  getMyConversations
);

router.get(
  "/:conversationId/messages",
  authorizeRoles("parent", "teacher"),
  getConversationMessages
);

router.post(
  "/:conversationId/messages",
  authorizeRoles("parent", "teacher"),
  sendConversationMessage
);

router.patch(
  "/:conversationId/status",
  authorizeRoles("teacher"),
  updateConversationStatus
);

module.exports = router;
