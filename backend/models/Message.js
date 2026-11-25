
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
      default: "Parent Update",
    },

    category: {
      type: String,
      enum: [
        "announcement",
        "homework_reminder",
        "exam_update",
        "general_update",
      ],
      default: "general_update",
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    schoolClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
