// mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"Katari Solutions" <${process.env.SMTP_USER}>`,
    to,
    subject: `OTP for Verification : ${otp}`,
    text: `Your OTP for verification is ${otp}. OTP will expire in 10mins.`
  });
}
