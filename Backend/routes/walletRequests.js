import express from 'express';
import { pool, poolConnect } from '../db.js';
import { upload } from '../middleware/fileUpload.js';
import { walletContainerClient } from '../azureBlob.js';
import { v4 as uuidv4 } from "uuid";

const walletRequestsRouter = express.Router();

/*
    Base Route: /walletrequests
*/

// =========================================
// 1️⃣ Create a wallet request (deposit / withdraw)
// =========================================
walletRequestsRouter.post('/create', upload.single("image"), async (req, res) => {
  try {
    await poolConnect;

    const { user_id, request_type, amount } = req.body;

    if (!user_id || !request_type || !amount) {
      return res.status(209).json({ status: 209, message: 'Missing required fields' });
    }

    if (!["DEPOSIT", "WITHDRAW"].includes(request_type)) {
      return res.status(209).json({ status: 209, message: 'Invalid request type' });
    }

    const file = req.file;

    if (!file) {
      return res
        .status(209)
        .json({ status: 209, message: "Please upload screenshot!" });
    }

    // 🔒 Safety fallback (frontend is primary validator)
    if (file.size > 2 * 1024 * 1024) {
      return res
        .status(209)
        .json({
          status: 209,
          message: "File size must be less than 2MB"
        });
    }

    if (!file.mimetype.startsWith("image/")) {
      return res.status(209).json({
        status: 209,
        message: "Only image files are allowed"
      });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(209).json({
        status: 209,
        message: "Invalid amount"
      });
    }

    // 1️⃣ Check if user already has a PENDING request
    const pendingCheck = await pool.request()
      .input("user_id", user_id)
      .query(`
        SELECT request_id, request_type, amount, status
        FROM wallet_requests WITH (NOLOCK)
        WHERE user_id = @user_id AND status = 'PENDING'
      `);

    if (pendingCheck.recordset.length > 0) {
      return res.status(209).json({
        status: 209,
        message: "A pending request already exists. Please wait for admin approval.",
        pending_request: pendingCheck.recordset[0]
      });
    }

    // upload image to cloud
    const blobName = `${user_id}/${uuidv4()}-${file.originalname}`;

    const blockBlobClient =
      walletContainerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });

      const imageUrl = blockBlobClient.url;

    // 2️⃣ Create new wallet request
    const result = await pool.request()
      .input('user_id', user_id)
      .input('request_type', request_type)
      .input('amount', amount)
      .input('pay_img', imageUrl)
      .query(`
        INSERT INTO wallet_requests (user_id, request_type, amount, pay_img)
        OUTPUT INSERTED.*
        VALUES (@user_id, @request_type, @amount, @pay_img)
      `);

    return res.status(201).json({
      status: 201,
      message: 'Wallet request created successfully',
      result: result.recordset[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

walletRequestsRouter.post('/create-withdraw', async (req, res) => {
  try {
    await poolConnect;

    const { user_id, request_type, amount } = req.body;

    if (!user_id || !request_type || !amount) {
      return res.status(209).json({ status: 209, message: 'Missing required fields' });
    }

    if (!["DEPOSIT", "WITHDRAW"].includes(request_type)) {
      return res.status(209).json({ status: 209, message: 'Invalid request type' });
    }

    // 1️⃣ Check if user already has a PENDING request
    const pendingCheck = await pool.request()
      .input("user_id", user_id)
      .query(`
        SELECT request_id, request_type, amount, status
        FROM wallet_requests WITH (NOLOCK)
        WHERE user_id = @user_id AND status = 'PENDING'
      `);

    if (pendingCheck.recordset.length > 0) {
      return res.status(209).json({
        status: 209,
        message: "A pending request already exists. Please wait for admin approval.",
        pending_request: pendingCheck.recordset[0]
      });
    }

    // 2️⃣ Create new wallet request
    const result = await pool.request()
      .input('user_id', user_id)
      .input('request_type', request_type)
      .input('amount', amount)
      .query(`
        INSERT INTO wallet_requests (user_id, request_type, amount)
        OUTPUT INSERTED.*
        VALUES (@user_id, @request_type, @amount)
      `);

    return res.status(201).json({
      status: 201,
      message: 'Wallet request created successfully',
      result: result.recordset[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// =========================================
// 2️⃣ Get all requests made by a user
// =========================================
walletRequestsRouter.post('/myrequests', async (req, res) => {
  try {
    await poolConnect;

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(209).json({ status: 209, message: 'User ID is required' });
    }

    const result = await pool.request()
      .input('user_id', user_id)
      .query(`
        SELECT top 50 *
        FROM wallet_requests WITH(NOLOCK)
        WHERE user_id = @user_id
        ORDER BY request_id DESC
      `);

    return res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// =========================================
// 2️⃣ Get all requests made by a user : active
// =========================================
walletRequestsRouter.post('/myrequests/active', async (req, res) => {
  try {
    await poolConnect;

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(209).json({ status: 209, message: 'User ID is required' });
    }

    const result = await pool.request()
      .input('user_id', user_id)
      .query(`
        SELECT top 50 *
        FROM wallet_requests WITH(NOLOCK)
        WHERE user_id = @user_id and status = 'PENDING'
        ORDER BY request_id DESC
      `);

    return res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// =========================================
// 3️⃣ Admin: Get all wallet requests
// =========================================
walletRequestsRouter.get('/all', async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request()
      .query(`
        SELECT TOP 1000 wr.*, u.email, u.phone
        FROM wallet_requests wr WITH(NOLOCK)
        LEFT JOIN users u WITH(NOLOCK) ON u.user_id = wr.user_id
        ORDER BY wr.request_id DESC
      `);

    return res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});


// =========================================
// 3️⃣ Admin: Get all wallet requests
// =========================================
walletRequestsRouter.get('/allPending', async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request()
      .query(`
        SELECT TOP 1000 wr.*, u.email, up.full_name, u.phone, 
        	ba.acc_number, ba.bank_name, ba.IFSC_code, ba.branch_name, ba.is_upi_available, ba.mobile
        FROM wallet_requests wr WITH(NOLOCK)
        LEFT JOIN users u WITH(NOLOCK) ON u.user_id = wr.user_id
        LEFT JOIN user_profiles up WITH(NOLOCK) ON up.user_id = wr.user_id
        LEFT JOIN BankAccounts ba WITH(NOLOCK) ON ba.user_id = wr.user_id
        WHERE wr.status = 'PENDING'
        ORDER BY wr.request_id DESC
      `);

    return res.status(201).json({
      status: 201,
      message: 'success',
      result: result.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// =========================================
// 4️⃣ Admin: Update request status + update wallet + transaction log
// =========================================
walletRequestsRouter.post('/update-status', async (req, res) => {
  const transaction = pool.transaction();

  try {
    await poolConnect;
    await transaction.begin();

    const { request_id, status, admin_note, payment_ref } = req.body;

    if (!request_id || !status) {
      return res.status(209).json({ status: 209, message: "Missing required fields" });
    }

    const allowed = ["PENDING", "APPROVED", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(209).json({ status: 209, message: "Invalid status value" });
    }

    // ===============================
    // 1️⃣ Fetch original request
    // ===============================
    const req1 = transaction.request();
    const requestData = await req1
      .input("request_id", request_id)
      .query(`
        SELECT request_id, user_id, amount, request_type, status
        FROM wallet_requests WITH (UPDLOCK)
        WHERE request_id = @request_id
      `);

    if (requestData.recordset.length === 0) {
      return res.status(209).json({ status: 209, message: "Request not found" });
    }

    const reqRow = requestData.recordset[0];

    if (reqRow.status !== "PENDING") {
      return res.status(209).json({
        status: 209,
        message: "Only PENDING requests can be updated"
      });
    }

    const userId = reqRow.user_id;
    const amount = parseFloat(reqRow.amount);
    const type = reqRow.request_type;

    // ===============================
    // 2️⃣ Update wallet_requests
    // ===============================
    const req2 = transaction.request();
    const updateResult = await req2
      .input("request_id", request_id)
      .input("status", status)
      .input("admin_note", admin_note || "")
      .input("payment_ref", payment_ref || "")
      .query(`
        UPDATE wallet_requests
        SET status = @status,
            admin_note = @admin_note,
            payment_ref = @payment_ref,
            updated_at = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE request_id = @request_id
      `);

    const updatedRow = updateResult.recordset[0];

    // ===============================
    // 3️⃣ If APPROVED → Update Wallet
    // ===============================
    if (status === "APPROVED") {

      // Fetch wallet
      const req3 = transaction.request();
      const walletResult = await req3
        .input("userId", userId)
        .query(`
          SELECT wallet_id, balance
          FROM wallets WITH (UPDLOCK)
          WHERE user_id = @userId
        `);

      if (walletResult.recordset.length === 0) {
        throw new Error("Wallet not found for user");
      }

      const wallet = walletResult.recordset[0];

      if (type === "WITHDRAW" && wallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance =
        type === "DEPOSIT"
          ? wallet.balance + amount
          : wallet.balance - amount;

      // Update wallet balance
      const req4 = transaction.request();
      await req4
        .input("wallet_id", wallet.wallet_id)
        .input("newBalance", newBalance)
        .query(`
          UPDATE wallets
          SET balance = @newBalance, last_updated = SYSDATETIME()
          WHERE wallet_id = @wallet_id
        `);

      // Insert wallet transaction
      const req5 = transaction.request();
      await req5
        .input("wallet_id", wallet.wallet_id)
        .input("amount", type === "DEPOSIT" ? amount : -amount)
        .input("reference_id", request_id)
        .input("txn_type", "SELF")
        .query(`
          INSERT INTO wallet_transactions (wallet_id, amount, reference_id, txn_type)
          VALUES (@wallet_id, @amount, @reference_id, @txn_type)
        `);
    }

    await transaction.commit();

    return res.status(201).json({
      status: 201,
      message: "Wallet request updated successfully",
      result: updatedRow,
      wallet_updated: status === "APPROVED"
    });

  } catch (err) {
    console.error("Update-status error:", err);

    try { await transaction.rollback(); } catch (e) {}

    return res.status(500).json({
      status: 500,
      message: err.message || "Server error"
    });
  }
});


export default walletRequestsRouter;