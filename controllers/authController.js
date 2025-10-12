import genToken from "../config/genToken.js"
import { sendOTPMail } from "../config/mail.js"
import UserModel from "../models/userModel.js"
import bcrypt from "bcryptjs"

export const SignUp = async (req, res) => {
    const { fullName, email, password, mobileNumber, role } = req.body
    try {
        // console.log(fullName, email, password, mobileNumber, role);
        const user = await UserModel.findOne({ email })
        if (user) return res.json({ success: false, message: "User already exist" })

        if (password.length < 6) return res.json({ success: false, message: "Password must be 6 character long" })

        if (mobileNumber.length < 10) return res.json({ success: false, message: "Invalid mobile number" })

        // hash password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await UserModel.create({
            fullName,
            email,
            password: hashedPassword,
            mobileNumber,
            role
        })

        const token = await genToken(newUser._id)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        })
        res.json({ success: true, message: "User created successfully", token })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const SignIn = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await UserModel.findOne({ email })
        if (!user) return res.json({ success: false, message: "User does not exist" })


        // compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid credentials" })

        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        })
        res.json({ success: true, message: "User signIn successfully!", token, user })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const SignOut = async (req, res) => {

    try {
        res.clearCookie("token")
        res.json({ success: true, message: "User signOut successfully!" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const sendOtp = async (req, res) => {
    try {
        const {email}  = req.body
        // console.log(email)
        const user = await UserModel.findOne({ email })
        if (!user) return res.json({ success: false, message: "User does not exist" })
        // generate otp
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
        await user.save();
        await sendOTPMail(email, otp);
        res.json({ success: true, message: "OTP sent to your email" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ success: false, message: "User does not exist" })
        if (user.resetOtp !== otp) return res.json({ success: false, message: "Invalid OTP" })
        if (user.otpExpiryTime < Date.now()) return res.json({ success: false, message: "OTP expired" })
        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpiryTime = undefined;
        await user.save();
        res.json({ success: true, message: "OTP verified successfully!" })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}  


export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ success: false, message: "User does not exist" })
        if (!user.isOtpVerified) return res.json({ success: false, message: "OTP not verified" })
        if (newPassword.length < 6) return res.json({ success: false, message: "Password must be 6 character long" })
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.isOtpVerified = false;
        await user.save();
        res.json({ success: true, message: "Password reset successfully!" })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}



export const googleAuth = async(req,res)=>{
    try {
        const { fullName ,email, mobileNumber,role} = req.body;
        let user = await UserModel.findOne({ email });
        if(!user){
            user = await UserModel.create({
                fullName,
                email,
                mobileNumber,
                role
            })
        } 

        
        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        })
        res.json({ success: true, message: "User created successfully", token })


    } catch (error) {
          res.json({ success: false, message: error.message })
    }
}