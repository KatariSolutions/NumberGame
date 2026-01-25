import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import http from "http";
import { Server } from "socket.io";
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
import bidsRouter from "./routes/bids.js";
import gamesRouter from "./routes/games.js";
import bankRouter from "./routes/bank.js";
import walletRequestsRouter from "./routes/walletRequests.js";
import uploadRouter from "./routes/upload.js";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.set('trust proxy', false);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // your frontend port
    methods: ["GET", "POST"],
    allowedHeaders: "*",
    credentials: true,
  }));
app.use(logger);
app.use(globalLimiter);

app.use('/welcome', (req, res) => res.send("Welcome to new project"));
app.use("/api/auth", authRouter);
app.use("/api/auth/verify-token", verifyToken, (req,res) => {
  res.status(201).json({status:201, message:'valid session'});
});
app.use("/api/user", verifyToken, userRouter);
app.use("/api/wallet", verifyToken, walletRouter);
app.use("/api/walletrequests", verifyToken, walletRequestsRouter);
app.use("/api/bids", verifyToken, bidsRouter);
app.use("/api/games", verifyToken, gamesRouter);
app.use("/api/bank", verifyToken, bankRouter);
app.use("/api/upload", verifyToken, uploadRouter);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  connectionStateRecovery: false, // fully off
});

io.use(async (socket, next) => {
  try{
    const authHeader = socket.handshake.headers.authorization || socket.handshake.auth?.token;
    if (!authHeader) return next(new Error('Authentication token missing'));

    const token = authHeader.split(' ')[1] || authHeader;
    const secret = process.env.JWT_SECRET || config.jwtSecret || 'CHANGE_THIS_SECRET';
    const payload = jwt.verify(token, secret);
    // console.log(payload);
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
})

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (user ${socket.user?.userId})`);
  
  socket.on('join_session', (payload) => {
    // payload is optional; we will use socket.user.userId
    console.log(`User ${socket.user.userId} joined the session ${socket.id}`);
    socket.server.gameSession.handleJoin(socket, { userId: socket.user.userId });
  });
  
  socket.on('place_bid', (payload) => {
    console.log(`User ${socket.user.userId} placed a bid`);
    socket.server.gameSession.handlePlaceBid(socket, { ...payload, userId: socket.user.userId });
  });
  
  socket.on('update_bid', (payload) => {
    console.log(`User ${socket.user.userId} updated bid`);
    socket.server.gameSession.handleUpdateBid(socket, payload);
  });

  socket.on("delete_bid", (payload) => {
    console.log(`User ${socket.user.userId} deleted bid`)
    socket.server.gameSession.handleDeleteBid(socket, payload);
  });
  
  socket.on('leave_session', () => {
    console.log('leave_session');
    console.log(`User ${socket.user.userId} left the session ${socket.id}`);
    socket.server.gameSession.handleLeave(socket);
  });

  socket.on('admin_update_results', (payload) => {
    console.log('Results updating by admin : ', payload);
    socket.server.gameSession.updateResultsByAdmin(payload);
  })
  
  socket.on('disconnect', (reason) => {
    console.log('disconnect');
    console.log(`User ${socket.user.userId} disconnected from session, due to : ${reason}`);
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
    // io.sockets.server = server;
    io.server = server;
    // store reference on io so handlers can reference the session engine
    io.gameSession = gameSession;

    const PORT = process.env.PORT || 8080;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`App listening at http://localhost:${PORT || 8080}`);
    });
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
})();

