import express from 'express';
import { pool, poolConnect } from '../db.js';

const bidsRouter = express.Router();

// POST /api/bids/getBidsbySession
bidsRouter.post('/getBidsbySession', async (req, res) => {
  try {
    const { session_id, user_id } = req.body;

    if (!session_id || !user_id) {
      return res.status(209).json({
        status: 209,
        message: 'Missing required parameters: session_id or user_id'
      });
    }

    await poolConnect;

    const result = await pool.request()
      .input('session_id', session_id)
      .input('user_id', user_id)
      .query(`
        SELECT TOP 100 
          user_result_id, 
          session_id, 
          user_id, 
          chosen_number, 
          amount, 
          is_winner, 
          payout
        FROM session_user_results
        WHERE session_id = @session_id AND user_id = @user_id
        ORDER BY user_result_id DESC
      `);

    res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error('getBidsbySession Error:', err);
    res.status(500).json({
      status: 500,
      message: 'Server error'
    });
  }
});

// POST /api/bids/getBidsbyUserId
bidsRouter.post('/getBidsbyUserId', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(209).json({
        status: 209,
        message: 'Missing required parameters: user_id'
      });
    }

    await poolConnect;

    const result = await pool.request()
      .input('user_id', user_id)
      .query(`
        SELECT TOP 100 SUR.session_id, 
        	SUM(SUR.amount) as bid_placed, 
        	SUM(SUR.payout) as payout, 
        	SUM(SUR.payout) - SUM(amount) as PnL,
        	MAX(SR.winning_number) as winning_number,
        	MAX(SR.declared_at) as results_declared_date
        FROM session_user_results SUR
        LEFT JOIN session_results SR with(nolock) ON SUR.session_id = SR.session_id
        WHERE SUR.user_id = @user_id
        GROUP BY SUR.session_id
        ORDER BY SUR.session_id desc
      `);

    res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error('getBidsbyUser Error:', err);
    res.status(500).json({
      status: 500,
      message: 'Server error'
    });
  }
});

export default bidsRouter;