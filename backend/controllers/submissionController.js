const Homework = require("../models/Homework");
const Submission = require("../models/Submission");
const User = require("../models/User");

const {
  uploadHomeworkFiles,
  deleteFromCloudinary,
  generatePrivateFileUrl,
} = require("../services/cloudinaryService");

// Student submits homework or submits a new attempt
const submitHomework = async (req, res) => {
  let uploadedFiles = [];

  try {
    const { homeworkId } = req.params;
    const studentId = req.user.id;

    // 1. Verify student
    const student = await User.findById(studentId);

    if (!student || student.role !== "student") {
      return res.status(403).json({
        message: "Only students can submit homework.",
      });
    }

    // 2. Verify homework
    const homework = await Homework.findById(homeworkId);

    if (!homework) {
      return res.status(404).json({
        message: "Homework assignment not found.",
      });
    }

    // 3. Verify student belongs to the assigned class
    if (
      !student.classId ||
      String(student.classId) !== String(homework.schoolClass)
    ) {
      return res.status(403).json({
        message: "You are not allowed to submit this homework.",
      });
    }

    // 4. Check existing submission
    let submission = await Submission.findOne({
      homework: homeworkId,
      student: studentId,
    });

    if (submission && submission.attempts.length > 0) {
      const latestAttempt = submission.attempts[submission.attempts.length - 1];

      if (latestAttempt.status !== "resubmission_required") {
        return res.status(400).json({
          message:
            "You cannot submit another attempt unless your teacher requests a resubmission.",
        });
      }
    }

    // 5. Upload files to Cloudinary
    uploadedFiles = await uploadHomeworkFiles(req.files || []);

    // 6. Prepare new attempt
    const attemptNumber = submission ? submission.attempts.length + 1 : 1;

    const newAttempt = {
      attemptNumber,
      files: uploadedFiles,
      submittedAt: new Date(),
      status: "submitted",
    };

    // 7. Create or update submission
    if (!submission) {
      submission = await Submission.create({
        homework: homeworkId,
        student: studentId,
        attempts: [newAttempt],
      });
    } else {
      submission.attempts.push(newAttempt);
      await submission.save();
    }

    return res.status(201).json({
      message: "Homework submitted successfully.",
      submission,
    });
  } catch (error) {
    // Clean up files if the database operation fails
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) => deleteFromCloudinary(file)),
      );
    }

    console.error("Homework submission error:", error);

    return res.status(500).json({
      message: "Unable to submit homework. Please try again.",
    });
  }
};

// Student views their own submission history
const getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user.id,
    })
      .populate("homework", "title description dueDate schoolClass createdBy")
      .populate({
        path: "homework",
        populate: [
          { path: "schoolClass", select: "name grade section" },
          { path: "createdBy", select: "name email" },
        ],
      })
      .populate("attempts.reviewedBy", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get student submissions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve your submissions.",
    });
  }
};

// Teacher views all students and their submissions for a specific homework
const getHomeworkSubmissions = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const teacherId = req.user.id;

    // 1. Verify homework ownership and retrieve all students in the class
    const homework = await Homework.findOne({
      _id: homeworkId,
      createdBy: teacherId,
    }).populate({
      path: "schoolClass",
      select: "name grade section students",
      populate: {
        path: "students",
        select: "name email",
      },
    });

    if (!homework) {
      return res.status(404).json({
        message: "Homework not found or you are not authorized to view it.",
      });
    }

    // 2. Retrieve actual submissions for this assignment
    const submissions = await Submission.find({
      homework: homeworkId,
    })
      .populate("student", "name email")
      .populate("attempts.reviewedBy", "name")
      .sort({ updatedAt: -1 });

    // 3. Create a lookup using each student's ID
    const submissionMap = new Map();

    submissions.forEach((submission) => {
      submissionMap.set(String(submission.student._id), submission);
    });

    // 4. Include every student, even those who haven't submitted
    const students = (homework.schoolClass?.students || []).map((student) => {
      const submission = submissionMap.get(String(student._id)) || null;

      const latestAttempt =
        submission && submission.attempts.length > 0
          ? submission.attempts[submission.attempts.length - 1]
          : null;

      return {
        student,
        submission,
        latestAttempt,
        status: latestAttempt ? latestAttempt.status : "pending",
      };
    });

    // 5. Send the complete class submission overview
    return res.status(200).json({
      homework,
      totalStudents: students.length,
      submittedCount: submissions.length,
      pendingCount: students.length - submissions.length,
      count: submissions.length,
      submissions,
      students,
    });
  } catch (error) {
    console.error("Get homework submissions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve homework submissions.",
    });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const { submissionId, attemptNumber } = req.params;
    const { status, marks, feedback } = req.body;

    // 1. Validate requested status
    const allowedStatuses = ["under_review", "graded", "resubmission_required"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid review status.",
      });
    }

    // 2. Find submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found.",
      });
    }

    // 3. Verify that this teacher created the homework
    const homework = await Homework.findOne({
      _id: submission.homework,
      createdBy: req.user.id,
    });

    if (!homework) {
      return res.status(403).json({
        message: "You are not authorized to review this submission.",
      });
    }

    // 4. Find the requested attempt
    const attempt = submission.attempts.find(
      (item) => item.attemptNumber === Number(attemptNumber),
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Submission attempt not found.",
      });
    }

    // 5. Only the latest attempt can be reviewed
    const latestAttempt = submission.attempts[submission.attempts.length - 1];

    if (attempt._id.toString() !== latestAttempt._id.toString()) {
      return res.status(400).json({
        message: "Only the latest submission attempt can be reviewed.",
      });
    }

    if (
      attempt.status === "graded" ||
      attempt.status === "resubmission_required"
    ) {
      return res.status(400).json({
        message: "This attempt has already been reviewed.",
      });
    }

    // 6. Validate marks
    if (marks !== undefined && marks !== null) {
      if (typeof marks !== "number" || !Number.isFinite(marks) || marks < 0) {
        return res.status(400).json({
          message: "Marks must be a valid non-negative number.",
        });
      }

      attempt.marks = marks;
    }

    // 7. Resubmission requires teacher feedback
    if (status === "resubmission_required" && (!feedback || !feedback.trim())) {
      return res.status(400).json({
        message: "Please provide feedback explaining the corrections required.",
      });
    }

    if (feedback !== undefined) {
      attempt.feedback = feedback.trim();
    }

    attempt.status = status;

    if (status === "under_review") {
      attempt.reviewedBy = null;
      attempt.reviewedAt = null;
    } else {
      attempt.reviewedBy = req.user.id;
      attempt.reviewedAt = new Date();
    }

    await submission.save();

    return res.status(200).json({
      message: "Submission review updated successfully.",
      submission,
    });
  } catch (error) {
    console.error("Review submission error:", error);

    return res.status(500).json({
      message: "Unable to update submission review.",
    });
  }
};

const getChildSubmissions = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // 1. Verify parent-child relationship
    const parent = await User.findOne({
      _id: parentId,
      role: "parent",
      children: childId,
    });

    if (!parent) {
      return res.status(403).json({
        message: "You are not authorized to view this child's submissions.",
      });
    }

    // 2. Verify child exists
    const child = await User.findOne({
      _id: childId,
      role: "student",
    }).select("name email");

    if (!child) {
      return res.status(404).json({
        message: "Child not found.",
      });
    }

    // 3. Retrieve child's submission history
    const submissions = await Submission.find({
      student: childId,
    })
      .populate("homework", "title description dueDate schoolClass createdBy")
      .populate({
        path: "homework",
        populate: [
          { path: "schoolClass", select: "name grade section" },
          { path: "createdBy", select: "name" },
        ],
      })
      .populate("attempts.reviewedBy", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      child,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get child submissions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve child's submissions.",
    });
  }
};

const getSubmissionFileAccess = async (req, res) => {
  try {
    const { submissionId, attemptNumber, fileId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Find the submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found.",
      });
    }

    // 2. Verify that the requested attempt exists
    const attempt = submission.attempts.find(
      (item) => item.attemptNumber === Number(attemptNumber),
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Submission attempt not found.",
      });
    }

    // 3. Verify that the requested file belongs to this attempt
    const file = attempt.files.id(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found.",
      });
    }

    // 4. Verify access based on the user's role
    let authorized = false;

    if (userRole === "student") {
      authorized = String(submission.student) === String(userId);
    }

    if (userRole === "teacher") {
      const homework = await Homework.findOne({
        _id: submission.homework,
        createdBy: userId,
      });

      authorized = Boolean(homework);
    }

    if (userRole === "parent") {
      const parent = await User.findOne({
        _id: userId,
        role: "parent",
        children: submission.student,
      });

      authorized = Boolean(parent);
    }

    if (!authorized) {
      return res.status(403).json({
        message: "You are not authorized to view this file.",
      });
    }

    // 5. Do not expose legacy public-upload files through this endpoint
    if ((file.deliveryType || "upload") !== "authenticated") {
      return res.status(409).json({
        message:
          "This file uses the previous delivery configuration. It needs to be migrated before secure viewing.",
      });
    }

    // 6. Generate a five-minute signed download URL
    const signedUrl = generatePrivateFileUrl(file);

    return res.status(200).json({
      message: "File access authorized.",
      url: signedUrl,
      fileName: file.originalName,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Get submission file access error:", error);

    return res.status(500).json({
      message: "Unable to generate secure file access.",
    });
  }
};

module.exports = {
  submitHomework,
  getStudentSubmissions,
  getHomeworkSubmissions,
  reviewSubmission,
  getChildSubmissions,
  getSubmissionFileAccess,
};
