// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import logger from './middleware/logger.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import walletRouter from './routes/wallet.js';
import { verifyToken } from './middleware/authToken.js'; // keep for HTTP routes
import { globalLimiter } from './middleware/rateLimiters.js';
import config from './config.js';
import dotenv from "dotenv";
dotenv.config();

import GameSession from './GameSession.js';
import { poolConnect } from './db.js';

const app = express();
app.use(express.json());
app.set('trust proxy', false);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(logger);
app.use(globalLimiter);

app.use('/welcome', (req, res) => res.send("Welcome to new project"));
app.use("/api/auth", authRouter);
app.use("/api/auth/verify-token", verifyToken, (req,res) => {
  res.status(201).json({status:201, message:'valid session'});
});
app.use("/api/user", verifyToken, userRouter);
app.use("/api/wallet", verifyToken, walletRouter);

// create HTTP server and attach socket.io
const httpServer = createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket handshake auth middleware
// Expects header Authorization: Bearer <token>
io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization || socket.handshake.auth?.token;
    if (!authHeader) return next(new Error('Authentication token missing'));

    const token = authHeader.split(' ')[1] || authHeader; // support "Bearer <token>" or token direct

    // ===== Replace below with your verifyToken logic if it exposes a utility to decode token =====
    // I will use jwt.verify here; ensure JWT_SECRET matches your implementation.
    const secret = process.env.JWT_SECRET || config.jwtSecret || 'CHANGE_THIS_SECRET';
    const payload = jwt.verify(token, secret);
    // payload should contain user_id or userId depending on your token creation
    socket.user = {
      userId: payload.user_id ?? payload.userId ?? payload.id, // adapt to how your tokens are structured
      raw: payload
    };
    return next();
  } catch (err) {
    console.error('Socket auth error', err);
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user ${socket.user?.userId})`);
  // instantiate or reuse gameSession instance methods to handle events
  // We'll create and pass io to gameSession so the session engine listens/handles
  socket.on('join_session', (payload) => {
    // payload is optional; we will use socket.user.userId
    socket.server.gameSession.handleJoin(socket, { userId: socket.user.userId });
  });

  socket.on('place_bid', (payload) => {
    socket.server.gameSession.handlePlaceBid(socket, { ...payload, userId: socket.user.userId });
  });

  socket.on('update_bid', (payload) => {
    socket.server.gameSession.handleUpdateBid(socket, payload);
  });

  socket.on('leave_session', () => {
    socket.server.gameSession.handleLeave(socket);
  });

  socket.on('disconnect', (reason) => {
    socket.server.gameSession.handleDisconnect(socket);
  });
});

// Start DB pool then server
(async () => {
  try {
    await poolConnect;
    // create game session instance and attach to server so sockets can access it
    const gameSession = new GameSession(io);
    // attach to server object for easy access from sockets
    io.sockets.server = httpServer;
    io.server = httpServer;
    // store reference on io so handlers can reference the session engine
    io.gameSession = gameSession;
    httpServer.listen(config.port || 8080, '127.0.0.1', () => {
      console.log(`App listening at http://localhost:${config.port || 8080}`);
    });
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
})();