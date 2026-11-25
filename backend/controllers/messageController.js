const mongoose = require("mongoose");

const Message = require("../models/Message");
const SchoolClass = require("../models/Class");
const User = require("../models/User");

const sendClassMessage = async (req, res) => {
  try {
    const { subject, category, content, classId } = req.body;

    const allowedCategories = [
      "announcement",
      "homework_reminder",
      "exam_update",
      "general_update",
    ];

    if (!content?.trim() || !classId) {
      return res.status(400).json({
        message: "Message content and class are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        message: "Message cannot exceed 5000 characters",
      });
    }

    const selectedCategory = category || "general_update";

    if (!allowedCategories.includes(selectedCategory)) {
      return res.status(400).json({
        message: "Invalid message category",
      });
    }

    const schoolClass = await SchoolClass.findOne({
      _id: classId,
      teacher: req.user.id,
    });

    if (!schoolClass) {
      return res.status(404).json({
        message: "Class not found or access denied",
      });
    }

    if (!schoolClass.students.length) {
      return res.status(400).json({
        message: "No students are assigned to this class",
      });
    }

    const parents = await User.find({
      role: "parent",
      children: { $in: schoolClass.students },
    }).select("_id");

    if (!parents.length) {
      return res.status(400).json({
        message: "No linked parents found for this class",
      });
    }

    const recipientIds = parents.map((parent) => parent._id);

    const newMessage = await Message.create({
      subject: subject?.trim() || "Parent Update",
      category: selectedCategory,
      content: content.trim(),
      schoolClass: schoolClass._id,
      createdBy: req.user.id,
      recipients: recipientIds,
    });

    return res.status(201).json({
      message: "Message sent successfully",
      recipientCount: recipientIds.length,
      sentMessage: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};
const getTeacherMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      createdBy: req.user.id,
    })
      .populate("schoolClass", "name grade section")
      .populate("recipients", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch teacher messages",
      error: error.message,
    });
  }
};

const getParentMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      recipients: req.user.id,
    })
      .populate("createdBy", "name email")
      .populate("schoolClass", "name grade section")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch parent messages",
      error: error.message,
    });
  }
};

module.exports = {
  sendClassMessage,
  getTeacherMessages,
  getParentMessages,
};
