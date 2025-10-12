import nodemailer from "nodemailer";

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL, // generated ethereal user
    pass: process.env.PASS, // generated ethereal password
  },
});

// Wrap in an async IIFE so we can use await.
export const sendOTPMail =   async (to,otp) => {
   await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password ", // Subject line
 
    html: `<p> Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes. </p>`, // HTML body
  });
};

// send delivery otp
export const sendDeliveryOTPMail =   async (user,otp) => {
   await transporter.sendMail({
    from: process.env.EMAIL,
    to:user,
    subject: "Delivery OTP ", // Subject line
 
    html: `<p> Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes. </p>`, // HTML body
  });
};