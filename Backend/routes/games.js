import express from 'express';
import { pool, poolConnect } from '../db.js';

const gamesRouter = express.Router();

gamesRouter.get('/history', async (req, res) => {
    try {
        const {user_id} = req.params;
        await pool.connect();

        const result = await pool.request()
            .input('user_id', sql.BigInt, user_id)
            .query(`
                SELECT SUR.session_id, 
                	SUM(SUR.amount) as bid_placed, 
                	SUM(SUR.payout) as payout, 
                	SUM(SUR.payout) - SUM(amount) as PnL,
                	MAX(SR.winning_number) as winning_number,
                	MAX(SR.declared_at) as results_declared_date
                FROM session_user_results SUR
                LEFT JOIN session_results SR with(nolock) ON SUR.session_id = SR.session_id
                -- WHERE SUR.user_id = 32
                GROUP BY SUR.session_id
                ORDER BY SUR.session_id desc
            `);

        if (result.recordset.length === 0) {
          return res.status(209).json({ status : 209, result: [], message: "No history found!" });
        }

        res.status(201).json({
          status: 201,
          result: result.recordset[0],
        });
    } catch (err) {
        console.error("Error fetching games data : ", err);
        res.status(500).json({ status : 500, message: "Server error" });
    }
})

gamesRouter.post('/gameAnalytics', async (req,res) => {
    try {
        await poolConnect;

        const { fromDate, toDate } = req.body;

        const result = await pool.request()
          .input("fromDate", fromDate || null)
          .input("toDate", toDate || null)
          .query(`
                SELECT
                    gs.session_id,
                    gs.session_start,
                    gs.session_end,
                    sr.winning_number,
                    SUM(sur.amount) AS total_in,
                    SUM(sur.payout) AS total_out,
                    SUM(sur.amount) - SUM(sur.payout) AS pnl,
                    COUNT(DISTINCT sur.user_id) AS players_count
                FROM game_sessions AS gs
                INNER JOIN bids AS b
                    ON b.session_id = gs.session_id
                INNER JOIN session_results AS sr
                    ON sr.session_id = gs.session_id
                INNER JOIN session_user_results AS sur
                    ON sur.session_id = gs.session_id
                WHERE (@fromDate IS NULL OR gs.session_start >= @fromDate)
                    AND (@toDate IS NULL OR gs.session_start <= @toDate)
                GROUP BY
                    gs.session_id,
                    gs.session_start,
                    gs.session_end,
                    sr.winning_number
                HAVING SUM(b.amount) > 0
                ORDER BY gs.session_id DESC
        `);

        res.status(201).json({
          status: 201,
          summary: {
            total_in: result.recordsets[0].reduce((s, r) => s + (r.total_in || 0), 0),
            total_out: result.recordsets[0].reduce((s, r) => s + (r.total_out || 0), 0),
            total_pnl: result.recordsets[0].reduce((s, r) => s + (r.pnl || 0), 0),
          },
          sessions: result.recordsets[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})

gamesRouter.get('/gamestatus', async (req, res) => {
    try {
        await pool.connect();

        const result = await pool.request()
            .query(`
                SELECT is_active FROM game_control
            `);

        if (result.recordset.length === 0) {
          return res.status(209).json({ status : 209, result: [], message: "No control found!" });
        }

        res.status(201).json({
          status: 201,
          result: result.recordset[0],
        });
    } catch (err) {
        console.error("Error fetching games status : ", err);
        res.status(500).json({ status : 500, message: "Server error" });
    }
})

gamesRouter.post('/setgamestatus', async (req, res) => {
    try {
        await pool.connect();

        const {is_active} = req.body;

        const result = await pool.request()
            .input("is_active",is_active?1:0)
            .query(`
                UPDATE game_control
                SET is_active=@is_active
            `);

        res.status(201).json({
          status: 201,
          result: "Updated",
          message: "Updated Successfully!"
        });
    } catch (err) {
        console.error("Error fetching games status : ", err);
        res.status(500).json({ status : 500, message: "Server error" });
    }
})

export default gamesRouter;