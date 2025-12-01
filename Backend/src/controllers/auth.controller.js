
  import { generateToken } from "../lib/utils.js";
  import multer from "multer";
import User from "../models/user.model.js";
  import bcrypt from "bcrypt";

  import cloudinary from "../lib/cloudinary.js";

export const signup=async (req,res)=>{
  const {fullname,email,password}=req.body;
  try {
    if(!fullname || !email || !password){
      return res.status(400).json({message:"Please provide all required fields."});
    }
    if(password.length<6){
      res.status(400).json({message:"password must be at least 6 characters long."});
    }
    const user=await User.findOne({email});
    if(user){
      return res.status(400).json({message:"User already exists with this email."});
    }
    const salt=await bcrypt.genSalt(10);
    const hashPassword =await bcrypt.hash(password,salt);

    const newUser=new User({
      fullname,
      email,
      password:hashPassword
    });  

    if(newUser){
      generateToken(newUser._id,res);
      await newUser.save();
      res.status(201).json({
        _id:newUser._id,
        email:newUser.email,
        fullname:newUser.fullname,
        profilePic:newUser.profilePic,
        });
    } 
    else{
      res.status(400).json({
        message:"Invalid user data"
      });
    } 

  } catch (error) {
    console.log("Error in signup controller:",error.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export const login=async(req,res)=>{
  const {email,password}=req.body;

  try{
    const user=await User.findOne({email});
    if(!user){
      return res.status(400).json({message:"Invalid Credentials"});
    }
    const isMatch=await bcrypt.compare(password,user.password);
  
  if(!isMatch){
    return res.status(400).json({message:"Invalid Credentials"});
  }
  generateToken(user._id,res);

  res.status(200).json({
    _id:user._id,
    email:user.email,
    fullname:user.fullname,
    profilePic:user.profilePic,
  });
}
  catch(error){
    console.log("Error in login controller:",error.message);
    res.status(500).json({message:"Internal server error"});
  }

}

export const logout=(req,res)=>{
  try {
    res.cookie('jwt',"",{maxAge:0});

  res.status(200).json({message:"logged out successfully"});

  } catch (error) {
    console.log("Error in logging out:",error.message);
    res.status(500).json({message:"Internal server error"});
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "Profile Picture is required!" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars" },
      async (error, result) => {
        if (error) return res.status(500).json({ message: "Cloudinary upload failed" });

        const updateUser = await User.findByIdAndUpdate(
          userId,
          { profilePic: result.secure_url },
          { new: true }
        );

        res.status(200).json({
          message: "Profile pic uploaded",
          profilePic: updateUser.profilePic,
        });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.log("Error in updateProfile controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth=(req,res)=>{
  try {
      res.status(200).json(req.user);

  } catch (error) {
    console.log("Error in checkAuth controller:",error.message);
    res.status(500).json({message:"Internal server error"});
  }
}

  

