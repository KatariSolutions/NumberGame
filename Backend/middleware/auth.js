import jwt from 'jsonwebtoken';
import config from '../config.js';

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, config.jwtsecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}