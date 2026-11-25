const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const app = express();
const classRoutes = require("./routes/classRoutes");
const homeworkRoutes = require("./routes/homeworkRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");


app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/", (req, res) => {
  res.send("Smart School Connect Backend is running!");
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

const authorizeRoles = require("./middleware/authorizeRoles");

app.get(
  "/api/teacher-only",
  authMiddleware,
  authorizeRoles("teacher"),
  (req, res) => {
    res.status(200).json({
      message: "Welcome, Teacher!",
      user: req.user,
    });
  },
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
