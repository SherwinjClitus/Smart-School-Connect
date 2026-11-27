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

    if (subject && subject.trim().length > 150) {
      return res.status(400).json({
        message: "Subject cannot exceed 150 characters",
      });
    }

    const selectedCategory = category || "general_update";

    if (!allowedCategories.includes(selectedCategory)) {
      return res.status(400).json({
        message: "Invalid message category",
      });
    }

    // Verify that this class belongs to the logged-in teacher
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

    // Find parents linked to students in this class
    const parents = await User.find({
      role: "parent",
      children: { $in: schoolClass.students },
    }).select("_id");

    // Include both students and their linked parents as recipients
    const recipientIds = [
      ...schoolClass.students,
      ...parents.map((parent) => parent._id),
    ];

    // Remove duplicate recipient IDs
    const uniqueRecipientIds = [
      ...new Map(recipientIds.map((id) => [id.toString(), id])).values(),
    ];

    const newMessage = await Message.create({
      subject: subject?.trim() || "School Announcement",
      category: selectedCategory,
      content: content.trim(),
      schoolClass: schoolClass._id,
      createdBy: req.user.id,
      recipients: uniqueRecipientIds,
    });

    return res.status(201).json({
      message: "Announcement sent successfully",
      recipientCount: uniqueRecipientIds.length,
      sentMessage: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send announcement",
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

    return res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Fetch teacher messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch teacher messages",
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

    return res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Fetch parent messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch parent messages",
    });
  }
};

// Student announcements
const getStudentMessages = async (req, res) => {
  try {
    // Get the logged-in student's assigned class
    const student = await User.findOne({
      _id: req.user.id,
      role: "student",
    }).select("classId");

    if (!student) {
      return res.status(404).json({
        message: "Student account not found",
      });
    }

    if (!student.classId) {
      return res.status(200).json({
        count: 0,
        messages: [],
      });
    }

    // Fetch announcements for the student's class.
    // This includes older announcements created before students
    // were added to the recipients list.
    const messages = await Message.find({
      schoolClass: student.classId,
    })
      .populate("createdBy", "name email")
      .populate("schoolClass", "name grade section")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Fetch student announcements error:", error);

    return res.status(500).json({
      message: "Failed to fetch student announcements",
    });
  }
};

module.exports = {
  sendClassMessage,
  getTeacherMessages,
  getParentMessages,
  getStudentMessages,
};
