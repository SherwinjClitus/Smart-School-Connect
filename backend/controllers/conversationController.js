const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");
const User = require("../models/User");
const SchoolClass = require("../models/Class");

// Verify that the logged-in user participates in this conversation
const getAuthorizedConversation = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    $or: [{ parent: userId }, { teacher: userId }],
  });
};

// CREATE CONVERSATION
const createConversation = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      category,
      content,
      priority: requestedPriority,
    } = req.body;

    if (!studentId || !subject?.trim() || !category || !content?.trim()) {
      return res.status(400).json({
        message: "Student, subject, category and message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const allowedCategories = [
      "attendance",
      "urgent",
      "academic",
      "homework",
      "administrative",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid conversation category" });
    }

    if (subject.trim().length > 150 || content.trim().length > 5000) {
      return res.status(400).json({
        message: "Subject or message exceeds the allowed length",
      });
    }

    // Teachers can independently select Normal or High priority.
    if (
      req.user.role === "teacher" &&
      requestedPriority !== undefined &&
      !["normal", "high"].includes(requestedPriority)
    ) {
      return res.status(400).json({
        message: "Invalid conversation priority",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student || !student.classId) {
      return res.status(404).json({
        message: "Student or student's class not found",
      });
    }

    const schoolClass = await SchoolClass.findById(student.classId);

    if (!schoolClass) {
      return res.status(404).json({
        message: "Student's class not found",
      });
    }

    let parent;
    let teacher;

    // PARENT INITIATED CONVERSATION
    if (req.user.role === "parent") {
      const isLinked = await User.exists({
        _id: req.user.id,
        role: "parent",
        children: student._id,
      });

      if (!isLinked) {
        return res.status(403).json({
          message: "You are not authorized to contact about this student",
        });
      }

      parent = await User.findById(req.user.id);

      teacher = await User.findOne({
        _id: schoolClass.teacher,
        role: "teacher",
      });
    }

    // TEACHER INITIATED CONVERSATION
    else if (req.user.role === "teacher") {
      if (schoolClass.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not authorized to contact this student",
        });
      }

      parent = await User.findOne({
        role: "parent",
        children: student._id,
      });

      teacher = await User.findById(req.user.id);
    } else {
      return res.status(403).json({
        message: "Only parents and teachers can create conversations",
      });
    }

    if (!parent || !teacher) {
      return res.status(404).json({
        message: "Linked parent or assigned teacher not found",
      });
    }

    // Parent priority remains category-based.
    // Teacher priority is independently selected and defaults to normal.
    const priority =
      req.user.role === "teacher"
        ? requestedPriority || "normal"
        : category === "urgent" || category === "attendance"
          ? "high"
          : "normal";

    const conversation = await Conversation.create({
      subject: subject.trim(),
      category,
      priority,
      parent: parent._id,
      teacher: teacher._id,
      student: student._id,
      schoolClass: schoolClass._id,
      createdBy: req.user.id,
    });

    const firstMessage = await ConversationMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: content.trim(),
      readBy: [{ user: req.user.id }],
    });

    conversation.lastMessageAt = firstMessage.createdAt;
    await conversation.save();

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation,
      firstMessage,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      message: "Failed to create conversation",
    });
  }
};

// GET LOGGED-IN USER'S CONVERSATIONS
const getMyConversations = async (req, res) => {
  try {
    const filter =
      req.user.role === "parent"
        ? { parent: req.user.id }
        : req.user.role === "teacher"
          ? { teacher: req.user.id }
          : null;

    if (!filter) {
      return res.status(403).json({
        message: "Only parents and teachers can view conversations",
      });
    }

    const conversations = await Conversation.find(filter)
      .populate("parent", "name email")
      .populate("teacher", "name email")
      .populate("student", "name email")
      .populate("schoolClass", "name grade section")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      message: "Failed to fetch conversations",
    });
  }
};

// GET MESSAGES INSIDE A CONVERSATION
const getConversationMessages = async (req, res) => {
  try {
    const conversation = await getAuthorizedConversation(
      req.params.conversationId,
      req.user.id,
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Mark messages from the other participant as read.
    await ConversationMessage.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user.id },
        "readBy.user": { $ne: req.user.id },
      },
      {
        $push: {
          readBy: { user: req.user.id, readAt: new Date() },
        },
      },
    );

    const messages = await ConversationMessage.find({
      conversation: conversation._id,
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      conversation,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch conversation messages",
    });
  }
};

// SEND A REPLY
const sendConversationMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        message: "Message cannot exceed 5000 characters",
      });
    }

    const conversation = await getAuthorizedConversation(
      req.params.conversationId,
      req.user.id,
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Prevent replies to closed conversations.
    if (["resolved", "archived"].includes(conversation.status)) {
      return res.status(400).json({
        message: "This conversation is closed and cannot receive new replies",
      });
    }

    const newMessage = await ConversationMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: content.trim(),
      readBy: [{ user: req.user.id }],
    });

    conversation.lastMessageAt = newMessage.createdAt;

    // Automatically move open conversations to in progress.
    if (conversation.status === "open") {
      conversation.status = "in_progress";
    }

    await conversation.save();
    await newMessage.populate("sender", "name role");

    return res.status(201).json({
      message: "Reply sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error("Send conversation message error:", error);

    return res.status(500).json({
      message: "Failed to send reply",
    });
  }
};

// UPDATE CONVERSATION STATUS (TEACHER ONLY)
const updateConversationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["open", "in_progress", "resolved", "archived"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid conversation status",
      });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      teacher: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    conversation.status = status;

    conversation.resolvedAt = status === "resolved" ? new Date() : null;

    // Resolved conversations move to Archived immediately.
    conversation.archivedAt = ["resolved", "archived"].includes(status)
      ? new Date()
      : null;

    await conversation.save();

    return res.status(200).json({
      message: "Conversation status updated successfully",
      conversation,
    });
  } catch (error) {
    console.error("Update conversation status error:", error);

    return res.status(500).json({
      message: "Failed to update conversation status",
    });
  }
};

module.exports = {
  createConversation,
  getMyConversations,
  getConversationMessages,
  sendConversationMessage,
  updateConversationStatus,
};
