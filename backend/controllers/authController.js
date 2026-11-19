const User = require('../models/User')
const bcrypt = require('bcryptjs')

const registerUser = async (req,res) =>{
    console.log(req.body);
    const userData = req.body;
    try{
        const existingUser = await User.findOne({
            email:userData.email
        });
        if(existingUser){
            return res.status(409).json({
                message:"Email aleardy registered"
            });
        }
        const hashedPassword = await bcrypt.hash(userData.password,10)

        const newUser = new User({
            name:userData.name,
            email:userData.email,
            password:hashedPassword,
            role:userData.role
        });
        await newUser.save();
        return res.status(201).json({
            message:"User registered successfully"
        });
    }
    catch(error){
        console.log("Regsitration error:",error);

        return res.status(500).json({
            message:"Internal server error"
        });
    }
};

module.exports = {registerUser}