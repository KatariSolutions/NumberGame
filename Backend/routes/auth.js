import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool, poolConnect } from '../db.js';
import config from '../config.js';

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    await poolConnect; // ✅ NO parentheses

    const { email, password, phone } = req.body;

    // 🔍 Check if user already exists
    const checkResult = await pool.request()
      .input("email", email)
      .query("SELECT user_id FROM Users WHERE email = @email");

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input("email", email)
      .input("password_hash", hashed)
      .input("phone",phone)
      .query("INSERT INTO Users (email, password_hash, phone) VALUES (@email, @password_hash, @phone)");

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    await poolConnect; // ✅ NO parentheses

    const { email, password } = req.body;

    const result = await pool.request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email=@email");

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials! Please register first" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.user_id }, config.jwtsecret, { expiresIn: "1h" });
    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default authRouter;