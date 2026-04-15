// utils/generateOtp.js
const passwordResetGenerateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
};

// utils/sendEmail.js (use nodemailer or your preferred service)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  // host: "smtp.zoho.com",
  secure: true,
  port: 465,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

const sendPasswordResetOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: '"HuntsWorld" <no-reply@huntsworld.com>',
    to: email,
    subject: 'Your Password Reset OTP',
    html: `
      <h2>Password Reset Request</h2>
      <p>Your 4-digit OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
      <p>It will expire in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};

module.exports = { passwordResetGenerateOtp, sendPasswordResetOtpEmail };