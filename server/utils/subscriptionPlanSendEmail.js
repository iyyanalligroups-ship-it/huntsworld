const nodemailer = require("nodemailer");

const subscriptionPlanSendEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: "smtp.zoho.in",
      host: "smtp.gmail.com",
      secure: true,
      port: 465,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: subject || "Verify Your Email",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = subscriptionPlanSendEmail;
