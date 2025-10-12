import express from 'express';
import {googleAuth, resetPassword, sendOtp, SignIn, SignOut, SignUp, verifyOtp } from "../controllers/authController.js"


const authRoute = express.Router();

authRoute.post('/signup',SignUp);
authRoute.post('/signin',SignIn);
authRoute.post('/send-otp',sendOtp);
authRoute.post('/verify-otp',verifyOtp);
authRoute.post('/reset-password',resetPassword);
authRoute.post('/google-auth',googleAuth);
authRoute.get('/signout',SignOut);

export default authRoute;