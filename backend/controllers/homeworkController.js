const Homework = require("../models/Homework");
const SchoolClass = require("../models/Class");
const User = require("../models/User");

// TEACHER: Create homework for a class
const createHomework = async (req, res) => {
  try {
    const { title, description, dueDate, classId } = req.body;

    if (!title?.trim() || !description?.trim() || !dueDate || !classId) {
      return res.status(400).json({
        message: "Title, description, due date and class are required.",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid due date.",
      });
    }

    if (parsedDueDate < new Date()) {
      return res.status(400).json({
        message: "Due date cannot be in the past.",
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

    const homework = await Homework.create({
      title: title.trim(),
      description: description.trim(),
      dueDate: parsedDueDate,
      schoolClass: schoolClass._id,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Homework created successfully.",
      homework,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create homework.",
      error: error.message,
    });
  }
};

// TEACHER: View homework created by the logged-in teacher
const getTeacherHomework = async (req, res) => {
  try {
    const homework = await Homework.find({
      createdBy: req.user.id,
    })
      .populate("schoolClass", "name grade section")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      count: homework.length,
      homework,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch homework.",
      error: error.message,
    });
  }
};

// STUDENT: View homework assigned to their class
const getStudentHomework = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    if (!student || !student.classId) {
      return res.status(200).json({
        count: 0,
        homework: [],
        message: "You are not assigned to a class yet.",
      });
    }

    const homework = await Homework.find({
      schoolClass: student.classId,
    })
      .populate("schoolClass", "name grade section")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    const result = homework.map((task) => ({
      ...task.toObject(),
      status: task.completedBy.some(
        (id) => id.toString() === student._id.toString(),
      )
        ? "completed"
        : "pending",
    }));

    return res.status(200).json({
      count: result.length,
      homework: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch student homework.",
      error: error.message,
    });
  }
};

// STUDENT: Mark their own homework as completed
const completeHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.homeworkId);

    if (!homework) {
      return res.status(404).json({
        message: "Homework not found.",
      });
    }

    const student = await User.findById(req.user.id);

    if (
      !student ||
      !student.classId ||
      student.classId.toString() !== homework.schoolClass.toString()
    ) {
      return res.status(403).json({
        message: "You cannot update this homework.",
      });
    }

    const alreadyCompleted = homework.completedBy.some(
      (id) => id.toString() === student._id.toString(),
    );

    if (!alreadyCompleted) {
      homework.completedBy.push(student._id);
      await homework.save();
    }

    return res.status(200).json({
      message: "Homework marked as completed.",
      homeworkId: homework._id,
      status: "completed",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update homework.",
      error: error.message,
    });
  }
};

// PARENT: View homework belonging to a linked child
const getChildHomework = async (req, res) => {
  try {
    const { childId } = req.params;

    const parent = await User.findById(req.user.id);

    if (!parent || !parent.children.some((id) => id.toString() === childId)) {
      return res.status(403).json({
        message: "You are not linked to this student.",
      });
    }

    const child = await User.findOne({
      _id: childId,
      role: "student",
    });

    if (!child || !child.classId) {
      return res.status(200).json({
        count: 0,
        homework: [],
        message: "Student is not assigned to a class.",
      });
    }

    const homework = await Homework.find({
      schoolClass: child.classId,
    })
      .populate("schoolClass", "name grade section")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    const result = homework.map((task) => ({
      ...task.toObject(),
      status: task.completedBy.some(
        (id) => id.toString() === child._id.toString(),
      )
        ? "completed"
        : "pending",
    }));

    return res.status(200).json({
      child: {
        id: child._id,
        name: child.name,
      },
      count: result.length,
      homework: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch child homework.",
      error: error.message,
    });
  }
};

// PARENT: View homework for all linked children
const getParentHomework = async (req, res) => {
  try {
    const parent = await User.findById(req.user.id).populate(
      "children",
      "name email role classId",
    );

    if (!parent) {
      return res.status(404).json({
        message: "Parent account not found.",
      });
    }

    const childrenHomework = await Promise.all(
      parent.children.map(async (child) => {
        if (!child.classId) {
          return {
            child: {
              id: child._id,
              name: child.name,
            },
            homework: [],
          };
        }

        const homework = await Homework.find({
          schoolClass: child.classId,
        })
          .populate("schoolClass", "name grade section")
          .populate("createdBy", "name email")
          .sort({ dueDate: 1 });

        const result = homework.map((task) => ({
          ...task.toObject(),
          status: task.completedBy.some(
            (id) => id.toString() === child._id.toString(),
          )
            ? "completed"
            : "pending",
        }));

        return {
          child: {
            id: child._id,
            name: child.name,
          },
          homework: result,
        };
      }),
    );

    return res.status(200).json({
      count: childrenHomework.length,
      children: childrenHomework,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch children's homework.",
      error: error.message,
    });
  }
};

module.exports = {
  createHomework,
  getTeacherHomework,
  getStudentHomework,
  completeHomework,
  getChildHomework,
  getParentHomework,
};
