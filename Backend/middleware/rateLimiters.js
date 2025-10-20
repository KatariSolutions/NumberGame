// server/middleware/rateLimiters.js
import rateLimit from 'express-rate-limit';

// 1️⃣ Global fallback (optional)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // 300 reqs per 15 min
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2️⃣ Send OTP limiter — stricter
export const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5,                   // max 5 OTPs/hour per IP
  message: { error: 'Too many OTP requests. Try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3️⃣ Register limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // max 10 registrations per IP/hour
  message: { error: 'Too many registration attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4️⃣ Forgot-password limiter
export const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,                   // max 5 reset requests per IP/30min
  message: { error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 5,                   // Limit each IP to 5 login attempts per 5 minutes
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
