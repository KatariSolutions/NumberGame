import express from 'express';
import sql from "mssql";
import { pool, poolConnect } from '../db.js';
import config from '../config.js';
import dotenv from "dotenv";

dotenv.config();

const bankRouter = express.Router();

// Get bank details of a user
bankRouter.post("/get", async (req, res) => {
  const { user_id } = req.body; // extracted from JWT
  try {
    await poolConnect;

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT 
          ba_id,
          acc_number,
          bank_name,
          IFSC_code,
          branch_name,
          pincode,
          mobile,
          is_upi_available,
          last_updated
        FROM BankAccounts
        WHERE user_id = @user_id AND is_active = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(209).json({ status:209, hasBankDetails: false, data: null });
    }

    return res.status(201).json({
      status:201, 
      hasBankDetails: true,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error("BANK GET ERROR →", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// ✅ Create or update bank details
bankRouter.post('/update', async (req, res) => {
  try {
    await poolConnect;

    const { user_id, acc_number, bank_name, IFSC_code, branch_name, pincode, mobile, is_upi_available } = req.body;

    if (!acc_number || !bank_name || !IFSC_code || !mobile || !branch_name || !pincode) {
        return res.status(209).json({ status:209, message: "Missing required fields!" });
    }

    // Check if bank account already exists
    const check = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query("SELECT * FROM BankAccounts WHERE user_id = @user_id AND is_active = 1");

    if (check.recordset.length === 0) {
      // INSERT NEW BANK ACCOUNT
      await pool.request()
        .input("user_id", sql.BigInt, user_id)
        .input("acc_number", sql.VarChar(50), acc_number)
        .input("bank_name", sql.VarChar(50), bank_name)
        .input("IFSC_code", sql.VarChar(20), IFSC_code)
        .input("branch_name", sql.VarChar(20), branch_name)
        .input("pincode", sql.VarChar(10), pincode)
        .input("mobile", sql.VarChar(15), mobile)
        .input("is_upi_available", sql.Bit, is_upi_available ?? 0)
        .query(`
          INSERT INTO BankAccounts 
          (user_id, acc_number, bank_name, IFSC_code, branch_name, pincode, mobile, is_upi_available) 
          VALUES (@user_id, @acc_number, @bank_name, @IFSC_code, @branch_name, @pincode, @mobile, @is_upi_available)
        `);

      return res.status(201).json({ status:201, message: "Bank details added successfully!" });
    } else {
        // UPDATE EXISTING ACCOUNT
        await pool.request()
          .input("user_id", sql.BigInt, user_id)
          .input("acc_number", sql.VarChar(50), acc_number)
          .input("bank_name", sql.VarChar(50), bank_name)
          .input("IFSC_code", sql.VarChar(20), IFSC_code)
          .input("branch_name", sql.VarChar(80), branch_name)
          .input("pincode", sql.VarChar(10), pincode)
          .input("mobile", sql.VarChar(15), mobile)
          .input("is_upi_available", sql.Bit, is_upi_available ?? 0)
          .query(`
            UPDATE BankAccounts
            SET 
              acc_number = @acc_number,
              bank_name = @bank_name,
              IFSC_code = @IFSC_code,
              branch_name = @branch_name,
              pincode = @pincode,
              mobile = @mobile,
              is_upi_available = @is_upi_available,
              last_updated = SYSDATETIME()
            WHERE user_id = @user_id AND is_active = 1
          `);
    
        return res.status(201).json({ status:201, message: "Bank details updated successfully!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status : 500, error: 'Server error' });
  }
});

export default bankRouter;