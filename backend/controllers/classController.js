
const SchoolClass = require("../models/Class");
const User = require("../models/User");

// Create a class
const createClass = async (req, res) => {
  try {
    const { name, grade, section } = req.body;

    if (!name?.trim() || !grade || !section) {
      return res.status(400).json({
        message: "Name, grade and section are required.",
      });
    }

    const newClass = await SchoolClass.create({
      name: name.trim(),
      grade,
      section,
      teacher: req.user.id,
    });

    return res.status(201).json({
      message: "Class created successfully.",
      class: newClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create class.",
      error: error.message,
    });
  }
};

// Add a student and optionally link their parent
const addStudentToClass = async (req, res) => {
  try {
    const { studentEmail, parentEmail } = req.body;
    const { classId } = req.params;

    if (!studentEmail?.trim()) {
      return res.status(400).json({
        message: "Student email is required.",
      });
    }

    const schoolClass = await SchoolClass.findOne({
      _id: classId,
      teacher: req.user.id,
    });

    if (!schoolClass) {
      return res.status(404).json({
        message: "Class not found or you do not own this class.",
      });
    }

    const student = await User.findOne({
      email: studentEmail.trim().toLowerCase(),
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    if (
      student.classId &&
      student.classId.toString() !== schoolClass._id.toString()
    ) {
      return res.status(409).json({
        message: "Student already belongs to another class.",
      });
    }

    if (!schoolClass.students.some(
      (id) => id.toString() === student._id.toString()
    )) {
      schoolClass.students.push(student._id);
    }

    student.classId = schoolClass._id;

    // Link parent to this student if an email was supplied
    let parent = null;

    if (parentEmail?.trim()) {
      parent = await User.findOne({
        email: parentEmail.trim().toLowerCase(),
        role: "parent",
      });

      if (!parent) {
        return res.status(404).json({
          message: "Parent account not found.",
        });
      }

      const alreadyLinked = parent.children.some(
        (id) => id.toString() === student._id.toString()
      );

      if (!alreadyLinked) {
        parent.children.push(student._id);
      }

      await parent.save();
    }

    await student.save();
    await schoolClass.save();

    return res.status(200).json({
      message: parent
        ? "Student added and parent linked successfully."
        : "Student added successfully.",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      parent: parent
        ? {
            id: parent._id,
            name: parent.name,
            email: parent.email,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add student.",
      error: error.message,
    });
  }
};

// Get classes belonging to the logged-in teacher
const getMyClasses = async (req, res) => {
  try {
    const classes = await SchoolClass.find({
      teacher: req.user.id,
    })
      .populate("students", "name email role")
      .populate("teacher", "name email");

    return res.status(200).json({
      count: classes.length,
      classes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch classes.",
      error: error.message,
    });
  }
};

module.exports = {
  createClass,
  addStudentToClass,
  getMyClasses,
};
