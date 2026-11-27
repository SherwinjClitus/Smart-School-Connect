const mongoose = require("mongoose");

const submissionFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["jpg", "jpeg", "png", "pdf"],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: true },
);

const attemptSchema = new mongoose.Schema(
  {
    attemptNumber: {
      type: Number,
      required: true,
    },
    files: {
      type: [submissionFileSchema],
      validate: {
        validator: (files) => files.length > 0,
        message: "At least one file is required.",
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "graded", "resubmission_required"],
      default: "submitted",
    },
    marks: {
      type: Number,
      default: null,
      min: 0,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const submissionSchema = new mongoose.Schema(
  {
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attempts: {
      type: [attemptSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// One submission record per student per homework.
submissionSchema.index({ homework: 1, student: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
