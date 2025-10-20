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
      return res.status(203).json({ message: "Wallet not found" });
    }

    res.status(201).json({
      status: 201,
      result: result.recordset[0],
    });
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/**
 * @route POST /api/wallet/credit
 * @desc Add money to wallet (e.g. after successful payment)
 * @body { user_id, amount, reference_id }
 */
walletRouter.post("/credit", async (req, res) => {
  const { user_id, amount, reference_id } = req.body;

  if (!user_id || !amount || amount <= 0)
    return res.status(203).json({ error: "Invalid parameters" });

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
        .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id) VALUES (@wallet_id, @amount, @reference_id)`);

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
        .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id) VALUES (@wallet_id, @amount, @reference_id)`);
    }

    await transaction.commit();
    res.status(201).json({ message: "Wallet credited successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error("Credit error:", err);
    res.status(500).json({ error: "Transaction failed" });
  }
});


/**
 * @route POST /api/wallet/debit
 * @desc Deduct amount from wallet (e.g., when placing bid)
 * @body { user_id, amount, reference_id }
 */
walletRouter.post("/debit", async (req, res) => {
  const { user_id, amount, reference_id } = req.body;

  if (!user_id || !amount || amount <= 0)
    return res.status(400).json({ error: "Invalid parameters" });

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const walletResult = await transaction.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`SELECT wallet_id, balance FROM wallets WHERE user_id = @user_id`);

    if (walletResult.recordset.length === 0)
      return res.status(203).json({ error: "Wallet not found" });

    const wallet = walletResult.recordset[0];

    if (wallet.balance < amount)
      return res.status(203).json({ error: "Insufficient balance" });

    const newBalance = Number(wallet.balance) - Number(amount);

    await transaction.request()
      .input("wallet_id", sql.BigInt, wallet.wallet_id)
      .input("balance", sql.Decimal(10, 2), newBalance)
      .query(`UPDATE wallets SET balance = @balance, last_updated = SYSDATETIME() WHERE wallet_id = @wallet_id`);

    await transaction.request()
      .input("wallet_id", sql.BigInt, wallet.wallet_id)
      .input("amount", sql.Decimal(10, 2), -amount)
      .input("reference_id", sql.VarChar, reference_id || null)
      .query(`INSERT INTO wallet_transactions (wallet_id, amount, reference_id) VALUES (@wallet_id, @amount, @reference_id)`);

    await transaction.commit();
    res.status(201).json({ message: "Wallet debited successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error("Debit error:", err);
    res.status(500).json({ error: "Transaction failed" });
  }
});


/**
 * @route GET /api/wallet/transactions/:user_id
 * @desc Get last 10 wallet transactions
 */
walletRouter.get("/transactions/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    await pool.connect();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT TOP 10 wt.txn_id, wt.amount, wt.reference_id, wt.created_at
        FROM wallet_transactions wt
        JOIN wallets w ON w.wallet_id = wt.wallet_id
        WHERE w.user_id = @user_id
        ORDER BY wt.created_at DESC
      `);

    res.status(201).json({
      status: 201,
      result: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default walletRouter;
