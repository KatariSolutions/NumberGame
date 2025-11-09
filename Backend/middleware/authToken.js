import jwt from 'jsonwebtoken';
import config from '../config.js';

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  //console.log(authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  //console.log(token);
  //console.log('token : ',token);
  if (!token) return res.status(403).json({ status: 403, message: 'Token missing' });;

  jwt.verify(token, config.jwtsecret, (err, user) => {
    if (err) return res.send({status:401,message:'Token authentication failed'});
    req.user = user;
    next();
  });
}