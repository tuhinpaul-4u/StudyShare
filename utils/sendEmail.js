// utils/sendEmail.js
import nodemailer from "nodemailer";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing from .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // app password
    },
  });
};

const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  // Verify connection configuration — helpful for debugging
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"StudyShare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
  return info;
};

export default sendEmail;
