const Homework = require("../models/Homework");
const Submission = require("../models/Submission");
const User = require("../models/User");

const {
  uploadHomeworkFiles,
  deleteFromCloudinary,
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

module.exports = {
  submitHomework,
};
