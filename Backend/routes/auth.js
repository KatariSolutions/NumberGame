import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool, poolConnect } from '../db.js';
import config from '../config.js';
import { sendOtpEmail } from '../middleware/mailer.js';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    await poolConnect; 

    const { email, password, phone } = req.body;

    // 🔍 Check if mail already exists
    const checkEmail = await pool.request()
      .input("email", email)
      .query("SELECT user_id FROM Users WHERE email = @email");

    if (checkEmail.recordset.length > 0) {
      return res.status(209).json({ status : 209, error: "Email already exists" });
    }

    // 🔍 Check if phone already exists
    const checkPhone = await pool.request()
      .input("phone", phone)
      .query("SELECT user_id FROM Users WHERE phone = @phone");

    if (checkPhone.recordset.length > 0) {
      return res.status(209).json({ status : 209, error: "Phone number already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userResult = await pool.request()
      .input("email", email)
      .input("password_hash", hashed)
      .input("phone",phone)
      .query(`
        INSERT INTO Users (email, password_hash, phone)
        OUTPUT INSERTED.user_id
        VALUES (@email, @password_hash, @phone)
      `);

    // Extract userId from result
    const userId = userResult.recordset[0].user_id;

    // generate OTPs
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    const expires = new Date(Date.now() + 10*60*1000);

    await pool.request()
      .input('user_id', userId)
      .input('email_otp', emailOTP)
      .input('phone_otp', phoneOTP)
      .input('expires_at', expires)
      .query('INSERT INTO user_otps (user_id, email_otp, phone_otp, expires_at, is_verified) VALUES (@user_id,@email_otp,@phone_otp,@expires_at,0)');

    // send email OTP
    await sendOtpEmail(email, emailOTP);

    res.status(201).json({status : 201, message: "User registered", userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/request-otp', async (req, res) => {
  try{
    await poolConnect; 

    const {email} = req.body;

    // check email
    const result = await pool.request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email=@email");

    const user = result.recordset[0];
    if (!user) return res.status(209).json({status : 209, error: "User Not Found! Please register first" });

    // Extract userId from result
    const userId = result.recordset[0].user_id;

    // disable login by is_verified : 0
    await pool.request()
      .input('user_id', userId)
      .query('UPDATE users SET is_verified=0 WHERE user_id=@user_id');

    // generate OTPs
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    const expires = new Date(Date.now() + 10*60*1000);

    await pool.request()
      .input('user_id', userId)
      .input('email_otp', emailOTP)
      .input('phone_otp', phoneOTP)
      .input('expires_at', expires)
      .query('INSERT INTO user_otps (user_id, email_otp, phone_otp, expires_at, is_verified) VALUES (@user_id,@email_otp,@phone_otp,@expires_at,0)');

    // send email OTP
    await sendOtpEmail(email, emailOTP);

    res.status(201).json({status : 201, message: "OTP sent", userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } 
})

authRouter.post('/verify-otp', async (req, res) => {
  try {
    await poolConnect;
    const { user_id, email_otp } = req.body;
    //console.log('user_id : ', user_id);
    //console.log('email_otp : ', email_otp);

    const result = await pool.request()
      .input('user_id', user_id)
      .query('SELECT TOP 1 * FROM user_otps WHERE user_id=@user_id AND is_verified=0 ORDER BY created_at DESC');

    const row = result.recordset[0];
    //console.log(row);
    if (!row) return res.status(209).json({ status : 209, error:'Invalid or already verified!'});
    if (new Date(row.expires_at) < new Date()) return res.status(209).json({ status : 209, error:'OTP expired!'});

    if (parseInt(row.email_otp) !== parseInt(email_otp)) {
      return res.status(209).json({ status : 209, error:'Incorrect OTP'});
    }

    await pool.request()
      .input('verification_id', row.verification_id)
      .input('user_id', user_id)
      .query('UPDATE users SET is_verified=1 WHERE user_id=@user_id; UPDATE user_otps SET is_verified=1 WHERE user_id=@user_id;');

    res.status(201).json({status : 201, message: 'Verification successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({error:'Server error'});
  }
});

authRouter.post("/update-password", async (req, res) => {
  try{
    const { user_id, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    await pool.request()
      .input('user_id', user_id)
      .input('password_hash', hashed)
      .query('UPDATE users SET password_hash=@password_hash WHERE user_id=@user_id;')

    res.status(201).json({status : 201, message: "Password Updated"});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:'Server error'});
  }
})

authRouter.post("/login", async (req, res) => {
  try {
    await poolConnect; // ✅ NO parentheses

    const { email, password } = req.body;

    const result = await pool.request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email=@email");

    const user = result.recordset[0];
    if (!user) return res.status(209).json({status : 209, error: "User Not Found! Please register first" });

    if (!user.is_verified) return res.status(209).json({status : 209, error: "Please verify before login!" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(209).json({status : 209, error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.user_id }, config.jwtsecret, { expiresIn: "1h" });
    res.status(201).json({ status : 201, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default authRouter;