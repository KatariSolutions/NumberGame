// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import logger from './middleware/logger.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import { verifyToken } from './middleware/authToken.js';

import config from './config.js'

const app = express();
app.use(express.json());

//Middleware
app.set('trust proxy', true);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json());
app.use(cors());
app.use(logger);

// Sample Initial Route
app.use('/welcome', (req, res) => { 
    res.send("Welcome to new project");
});

// Auth Routes
app.use("/api/auth", authRouter);
app.use("/api/auth/verify-token", verifyToken, (req,res) => {
    res.status(201).json({status:201, message:'valid session'})
})

//user Routes
app.use("/api/user", verifyToken, userRouter);


let port = config.port || 8080;
app.listen(port,'127.0.0.1', ()=>{
    console.log(`App listening at http://localhost:${port}`);
});
