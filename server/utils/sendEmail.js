const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  // host: "smtp.gmail.com",
  host: "smtp.zoho.in",        // Zoho India (custom domain - Zoho Workplace)
  secure: true,
  port: 465,
  auth: {
    user: process.env.USER_AUTH_EMAIL, // Primary account: contact@huntsworld.com
    pass: process.env.USER_PASS,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `Huntsworld <${process.env.USER_EMAIL}>`, // Primary: contact@huntsworld.com (test)
      to,
      subject,
      text, // Fallback text version (optional)
      html, // Ensure HTML emails work
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

const sendOtpEmail = async (email, otp) => {
  const subject = "🔐 Your One-Time Password (OTP) for Verification";

  const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px;">

      <h2 style="color: #333; text-align: center;">Your One-Time Password (OTP)</h2>
      <p style="font-size: 16px; color: #555; text-align: center;">
        Use the OTP below to verify your email. This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 22px; font-weight: bold; color: #333;">
        ${otp}
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
        If you didn’t request this, please ignore this email. Do not share this OTP with anyone for security reasons.
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <a href="https://huntsworld.com/" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: #fff; text-decoration: none; font-size: 16px; border-radius: 5px;">Visit Huntsworld</a>
      </div>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p style="font-size: 12px; color: #888; text-align: center;">
        This is an automated message. Please do not reply to this email. For support, contact <a href="mailto:support@huntsworld.com">support@huntsworld.com</a>.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, "Your OTP Code: " + otp, htmlContent);
};

module.exports = { sendOtpEmail,sendEmail,  };
