// middleware/mailer.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOtpEmail(to, otp) {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Number Game',
    },
    subject: 'OTP for Verification',
    text: `Your OTP for verification is ${otp}. OTP will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial;">
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in <b>10 minutes</b>.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}

