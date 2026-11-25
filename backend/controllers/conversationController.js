const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const ConversationMessage = require("../models/ConversationMessage");
const User = require("../models/User");
const SchoolClass = require("../models/Class");

// Helper: Verify that the logged-in user participates in this conversation
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
    const { studentId, parentId, subject, category, content } = req.body;

    if (!studentId || !subject?.trim() || !category || !content?.trim()) {
      return res.status(400).json({
        message: "Student, subject, category and message are required",
      });
    }

    console.log("----- CONVERSATION ID DEBUG -----");
    console.log("studentId:", studentId);
    console.log("studentId type:", typeof studentId);
    console.log("studentId valid:", mongoose.Types.ObjectId.isValid(studentId));

    console.log("parentId:", parentId);
    console.log(
      "parentId valid:",
      parentId ? mongoose.Types.ObjectId.isValid(parentId) : "Not provided",
    );

    console.log("Logged-in user:", req.user);

    console.log("---------------------------------");

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      (parentId && !mongoose.Types.ObjectId.isValid(parentId))
    ) {
      return res.status(400).json({
        message: "Invalid student or parent ID",
      });
    }

    const allowedCategories = [
      "attendance",
      "urgent",
      "academic",
      "homework",
      "administrative",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid conversation category",
      });
    }

    if (subject.trim().length > 150 || content.trim().length > 5000) {
      return res.status(400).json({
        message: "Subject or message exceeds the allowed length",
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

    if (req.user.role === "parent") {
      // Parent can only create conversations about their linked children
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
    } else if (req.user.role === "teacher") {
      // Teacher must own the student's class
      if (schoolClass.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not authorized to contact this student",
        });
      }

      if (!parentId) {
        return res.status(400).json({
          message: "Please provide a parent ID",
        });
      }

      parent = await User.findOne({
        _id: parentId,
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

    const priority =
      category === "urgent" || category === "attendance" ? "high" : "normal";

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

    res.status(201).json({
      message: "Conversation created successfully",
      conversation,
      firstMessage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create conversation",
      error: error.message,
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

    res.status(200).json({
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversations",
      error: error.message,
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

    // Mark messages from the other participant as read
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

    res.status(200).json({
      conversation,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversation messages",
      error: error.message,
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

    if (
      conversation.status === "resolved" ||
      conversation.status === "archived"
    ) {
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

    if (conversation.status === "open") {
      conversation.status = "in_progress";
    }

    await conversation.save();

    await newMessage.populate("sender", "name role");

    res.status(201).json({
      message: "Reply sent successfully",
      newMessage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send reply",
      error: error.message,
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

    conversation.archivedAt = status === "archived" ? new Date() : null;

    await conversation.save();

    res.status(200).json({
      message: "Conversation status updated successfully",
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update conversation status",
      error: error.message,
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
