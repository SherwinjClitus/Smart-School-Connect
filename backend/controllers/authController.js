const User = require("../models/User");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
//   console.log(req.body);
  const userData = req.body || {};
  if(userData.email){
    userData.email = userData.email.trim().toLowerCase();
  }
  if(userData.name){
     userData.name = userData.name.trim().toLowerCase();
  }
 
  if (
    !userData.name ||
    !userData.email ||
    !userData.password ||
    !userData.role
  ) {
    return res.status(400).json({
      message: "All fields are required!",
    });
  }
  if (!/^\S+@\S+\.\S+$/.test(userData.email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }
  if (userData.password.trim().length < 8) {
    return res.status(400).json({
      message: "Password must be atleast 8 characters",
    });
  }
  if (!["student", "parent", "teacher"].includes(userData.role)) {
    return res.status(400).json({
      message: "Invalid user role",
    });
  }
  try {
    const existingUser = await User.findOne({
      email: userData.email,
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Email aleardy registered",
      });
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    });
    await newUser.save();
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.log("Regsitration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { registerUser };
