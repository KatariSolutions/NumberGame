import express from 'express';
import { pool, poolConnect } from '../db.js';
import config from '../config.js';

const userRouter = express.Router()

userRouter.get('/all', async(req, res) => {
    try{
        await poolConnect;

        const result = await pool.request()
            .query("SELECT user_id, email, phone, created_at FROM users")

        res.status(201).json({message:'success', result: result.recordset})
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})

userRouter.get('/:id', async (req, res) => {
  try {
    await poolConnect;

    const userId = req.params.id;
    // console.log('userId: ',userId)
    //console.log('user', req.user);

    const requestedId = parseInt(req.params.id);
    const loggedInId = parseInt(req.user.userId); // <-- from JWT payload

    // Check if the user is trying to access their own data
    if (requestedId !== loggedInId) {
      return res.status(403).json({ message: 'Forbidden: Cannot access other user data' });
    }

    const result = await pool.request()
      .input('userId', userId) // safely pass param to avoid SQL injection
      .query("SELECT user_id, email, phone, created_at FROM users WHERE user_id = @userId");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'success', result: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default userRouter;