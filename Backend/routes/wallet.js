import express from 'express';
import sql from "mssql";
import { pool, poolConnect } from '../db.js';
import config from '../config.js';
import dotenv from "dotenv";

dotenv.config();

const walletRouter = express.Router();

// Parse environment variables
const WALLET_MAX_LIMIT = parseFloat(process.env.WALLET_MAX_LIMIT) || 100000;
const BID_MAX_LIMIT = parseFloat(process.env.BID_MAX_LIMIT) || 10000;

/**
 * @route GET /api/wallet/balance/:user_id
 * @desc Get wallet balance for a user
 */
walletRouter.get("/balance/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    await pool.connect();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT w.wallet_id, w.balance
        FROM wallets w
        WHERE w.user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(209).json({ status : 209, message: "Wallet not found" });
    }

    res.status(201).json({
      status: 201,
      result: result.recordset[0],
    });
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    res.status(500).json({ status : 500, error: "Server error" });
  }
});


/**
 * @route POST /api/wallet/credit
 * @desc Add money to wallet (e.g. after successful payment)
 * @body { user_id, amount, reference_id }
 */
walletRouter.post("/credit", async (req, res) => {
  const { user_id, amount, reference_id, type } = req.body;

  if (!user_id || !amount || amount <= 0 /*|| amount > process.env.WALLET_MAX_LIMIT*/)
    return res.status(209).json({ status : 209, error: "Invalid parameters" });

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const walletResult = await transaction.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`SELECT wallet_id, balance FROM wallets WHERE user_id = @user_id`);

    if (walletResult.recordset.length === 0) {
      await transaction.request()
        .input("user_id", sql.BigInt, user_id)
        .input("balance", sql.Decimal(10, 2), amount)
        .query(`INSERT INTO wallets (user_id, balance) VALUES (@user_id, @balance)`);

      const walletIdResult = await transaction.request()
        .input("user_id", sql.BigInt, user_id)
        .query(`SELECT wallet_id FROM wallets WHERE user_id = @user_id`);

      const wallet_id = walletIdResult.recordset[0].wallet_id;

      await transaction.request()
        .input("wallet_id", sql.BigInt, wallet_id)
        .input("amount", sql.Decimal(10, 2), amount)
        .input("reference_id", sql.VarChar, reference_id || null)
        .input("type", sql.VarChar, type || null)
        .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id, txn_type) VALUES (@wallet_id, @amount, @reference_id, @type)`);

    } else {
      const wallet = walletResult.recordset[0];
      const newBalance = Number(wallet.balance) + Number(amount);

      await transaction.request()
        .input("wallet_id", sql.BigInt, wallet.wallet_id)
        .input("balance", sql.Decimal(10, 2), newBalance)
        .query(`UPDATE wallets SET balance = @balance, last_updated = SYSDATETIME() WHERE wallet_id = @wallet_id`);

      await transaction.request()
        .input("wallet_id", sql.BigInt, wallet.wallet_id)
        .input("amount", sql.Decimal(10, 2), amount)
        .input("reference_id", sql.VarChar, reference_id || null)
        .input("type", sql.VarChar, type || null)
        .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id, txn_type) VALUES (@wallet_id, @amount, @reference_id, @type)`);
    }

    await transaction.commit();
    res.status(201).json({ status:201, message: "Wallet credited successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error("Credit error:", err);
    res.status(500).json({ status : 500, error: "Transaction failed" });
  }
});


/**
 * @route POST /api/wallet/debit
 * @desc Deduct amount from wallet (e.g., when placing bid)
 * @body { user_id, amount, reference_id }
 */
walletRouter.post("/debit", async (req, res) => {
  const { user_id, amount, reference_id, type } = req.body;

  if (!user_id || !amount || amount <= 0)
    return res.status(209).json({ status : 209, error: "Invalid parameters" });

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const walletResult = await transaction.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`SELECT wallet_id, balance FROM wallets WHERE user_id = @user_id`);

    if (walletResult.recordset.length === 0)
      return res.status(209).json({ status : 209, error: "Wallet not found" });

    const wallet = walletResult.recordset[0];

    if (wallet.balance < amount)
      return res.status(209).json({ status : 209, error: "Insufficient balance" });

    const newBalance = Number(wallet.balance) - Number(amount);

    await transaction.request()
      .input("wallet_id", sql.BigInt, wallet.wallet_id)
      .input("balance", sql.Decimal(10, 2), newBalance)
      .query(`UPDATE wallets SET balance = @balance, last_updated = SYSDATETIME() WHERE wallet_id = @wallet_id`);

    await transaction.request()
      .input("wallet_id", sql.BigInt, wallet.wallet_id)
      .input("amount", sql.Decimal(10, 2), -amount)
      .input("reference_id", sql.VarChar, reference_id || null)
      .input("type", sql.VarChar, type || null)
      .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id, txn_type) VALUES (@wallet_id, @amount, @reference_id, @type)`);

    await transaction.commit();
    res.status(201).json({ status:201, message: "Wallet debited successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error("Debit error:", err);
    res.status(500).json({ status : 500, error: "Transaction failed" });
  }
});

/**
 * @route POST /api/wallet/transactions/:user_id
 * @desc POST wallet transactions (filtered or last 10 recent)
 */
// POST /api/wallet/transactions/:user_id
walletRouter.post("/transactions/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { txn_type, start_date, end_date } = req.body;

    await pool.connect();

    // Base query (we will override to TOP 10 when no filters)
    let baseQuery = `
      SELECT wt.txn_id, wt.wallet_id, wt.amount, wt.reference_id, wt.txn_type, wt.created_at
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.wallet_id
      WHERE w.user_id = @user_id
    `;

    // If no filters, return TOP 10 recent
    if (!txn_type && !start_date && !end_date) {
      //console.log('Going into first condition!!')
      const result = await pool.request()
        .input("user_id", sql.BigInt, user_id)
        .query(`
          SELECT TOP 10 wt.txn_id, wt.wallet_id, wt.amount, wt.reference_id, wt.txn_type, wt.created_at
          FROM wallet_transactions wt
          JOIN wallets w ON wt.wallet_id = w.wallet_id
          WHERE w.user_id = @user_id
          ORDER BY wt.created_at DESC
        `);

      if (result.recordset.length === 0) {
        return res.status(201).json({ status : 201, message: "No transactions found" });
      }

      return res.status(201).json({
        status: 201,
        result: result.recordset,
      });
    }

    // With filters: build query and bind inputs safely
    // Start with baseQuery and append conditions
    let filterQuery = baseQuery;
    const request = pool.request();
    request.input("user_id", sql.BigInt, user_id);

    //console.log('Going into second condition!!')
    //console.log('txn_type, start_date, end_date : ', txn_type, start_date, end_date)

    if (txn_type) {
      filterQuery += " AND wt.txn_type = @txn_type";
      request.input("txn_type", sql.VarChar(20), txn_type);
    }

    // if only one of start_date/end_date provided, handle accordingly
    if (start_date && end_date) {
      filterQuery += " AND wt.created_at BETWEEN @start_date AND @end_date";
      // convert to Date objects for safety (DB will accept)
      request.input("start_date", sql.DateTime, new Date(start_date));
      // include end of day for end_date by adding 23:59:59 if it's a plain date string
      const toDateObj = new Date(end_date);
      toDateObj.setHours(23, 59, 59, 999);
      request.input("end_date", sql.DateTime, toDateObj);
    } else if (start_date) {
      filterQuery += " AND wt.created_at >= @start_date";
      request.input("start_date", sql.DateTime, new Date(start_date));
    } else if (end_date) {
      filterQuery += " AND wt.created_at <= @end_date";
      const toDateObj = new Date(end_date);
      toDateObj.setHours(23, 59, 59, 999);
      request.input("end_date", sql.DateTime, toDateObj);
    }

    // order by latest
    filterQuery += " ORDER BY wt.created_at DESC";

    const filteredResult = await request.query(filterQuery);
    //console.log('filteredResult : ', filteredResult);

    if (filteredResult.recordset.length === 0) {
      return res.status(209).json({ status : 209, message: "No transactions found for given filters" });
    }

    return res.status(201).json({
      status: 201,
      result: filteredResult.recordset,
    });
  } catch (err) {
    console.error("Transaction Fetch Error:", err);
    res.status(500).json({ status : 500, error: "Server error" });
  }
});

export default walletRouter;