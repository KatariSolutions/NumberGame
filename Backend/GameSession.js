// gameSession.js
import { v4 as uuidv4 } from 'uuid';
import { pool, sql } from './db.js';
import moment from 'moment';

/**
 * GameSession engine
 * - Single global session active every 15 minutes
 * - ACTIVE 0-10m, LOCKED 10-12m (calc results), RESULTS 12-15m
 * - Only last bid per user counts (single chosen_number per user)
 * - Batch insert bids on LOCK
 * - Insert session, session_results, session_user_results
 * - Update wallets and wallet_transactions (payouts)
 */
class GameSession {
  constructor(io, opts = {}) {
    this.io = io;
    this.running = false;

    this.SESSION_MINUTES = opts.totalMinutes ?? 35; // adjust
    this.ACTIVE_MINUTES = opts.activeMinutes ?? 25; //adjust
    this.LOCKED_MINUTES = opts.lockedMinutes ?? 0;
    this.RESULTS_MINUTES = this.SESSION_MINUTES - this.ACTIVE_MINUTES - this.LOCKED_MINUTES;

    this.SESSION_MS = this.SESSION_MINUTES * 1000;
    this.ACTIVE_MS = this.ACTIVE_MINUTES * 1000;
    this.LOCKED_MS = this.LOCKED_MINUTES * 1000;
    this.BATCH_WRITE_INTERVAL_MS = opts.batchWriteIntervalMs ?? 30 * 1000;

    // in-memory state
    // bidsByUser: Map<userId, { chosen_number, amount, updatedAt }>
    this.current = null;
    this.batchTimer = null;
    this.tickInterval = null;

    this.startSessionLoop();
  }

  async checkIfActive() {
    const result = await pool.request().query('SELECT TOP 1 is_active FROM game_control');
    return result.recordset[0]?.is_active === true;
  }

  async updateResultsByAdmin(newResults = []) {
    const s = this.current;
    if (!s) {
      console.warn("⚠️ No active session to update results.");
      return { success: false, message: "No active session." };
    }

    if (s.status !== "ACTIVE") {
      console.warn("⚠️ Cannot update results — session already locked or ended.");
      return { success: false, message: "Cannot update results after lock." };
    }

    if (!Array.isArray(newResults) || newResults.length !== 6) {
      return { success: false, message: "Invalid results array. Must be [6 dice values]." };
    }

    // Validate numbers
    const valid = newResults.every(n => Number.isInteger(n) && n >= 1 && n <= 6);
    if (!valid) {
      return { success: false, message: "Each dice value must be between 1 and 6." };
    }

    // Update results in session
    s.results = newResults;
    s.resultCounts = {};
    for (const n of newResults) {
      s.resultCounts[n] = (s.resultCounts[n] || 0) + 1;
    }

    // Also update state for clients
    this.emitSessionStateToAll();

    return { success: true, message: "Results updated successfully." };
  }

  // not used
  stopAllSessions() {
    clearInterval(this.batchTimer);
    clearInterval(this.tickInterval);
    this.batchTimer = null;
    this.tickInterval = null;
    this.current = null;

    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: "Game stopped by admin.",
    });

    console.log("🛑 All sessions stopped due to GameControl flag OFF");
  }

  // create empty session
  createSession() {
    const now = Date.now();
    
    const preGeneratedResults = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);
    const resultCounts = {};
    for (const n of preGeneratedResults) {
      resultCounts[n] = (resultCounts[n] || 0) + 1;
    }

    return {
      sessionId: uuidv4(), // short-term id in-memory; we'll persist to DB with sequence session_id
      startedAt: now,
      status: 'ACTIVE',
      endsAt: now + this.SESSION_MS,
      lockAt: now + this.ACTIVE_MS,
      resultsAt: now + this.ACTIVE_MS + this.LOCKED_MS,
      // bidsByUser holds *only* last bid per user (single-number rule X)
      bidsByUser: new Map(), // userId -> { chosen_number, amount, updatedAt }
      players: new Map(), // userId -> Set(socketIds)
      results: preGeneratedResults,       // ✅ store generated results
      resultCounts: resultCounts,
    };
  }

  async startSessionLoop() {
    // If already running timers, don't create duplicates
    if (this.tickInterval || this.batchTimer) {
      console.log('GameSession already running (timers present), skipping start.');
      return;
    }
    const active = await this.checkIfActive();
    if (!active) {
      console.log('⚠️ Game is currently inactive (DB switch off).');
      return;
    }

    this.current = this.createSession();
    this.emitSessionStateToAll();

    this.batchTimer = setInterval(() => this.batchWriteBids(), this.BATCH_WRITE_INTERVAL_MS);
    this.tickInterval = setInterval(() => this._tick(), 1000);
    console.log('GameSession started', this.current.sessionId);
  }

  stopSessionLoop() {
    // clear timers and set current to null (keeps persisted DB records intact)
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    console.log('🛑 GameSession stopped (timers cleared)');
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: "Game has been deactivated by admin.",
    });
    this.emitSessionStateToAll();
  }

  _serializeSessionForClient() {
    const s = this.current;
    const now = Date.now();
    const remainingMs = Math.max(0, s.endsAt - now);
    const remainingActiveMs = Math.max(0, s.lockAt - now);
    // compute bid summary per chosen_number
    const summary = {};
    for (const [userId, userBids] of s.bidsByUser.entries()) {
      for (const [num, b] of Object.entries(userBids)) {
        if (!summary[num]) summary[num] = { totalAmount: 0, count: 0 };
        summary[num].totalAmount += Number(b.amount);
        summary[num].count += 1;
      }
    }
    return {
      sessionId: s.sessionId,
      status: s.status,
      startedAt: s.startedAt,
      endsAt: s.endsAt,
      lockAt: s.lockAt,
      resultsAt: s.resultsAt,
      remainingMs,
      remainingActiveMs,
      bidSummary: summary,
      playersCount: s.players.size,
      results: s.results ?? null,          // ✅ expose pre-generated results
      resultCounts: s.resultCounts ?? null
    };
  }

  emitSessionStateToAll() {
    this.io.to('GLOBAL_GAME_ROOM').emit('session_state', this._serializeSessionForClient());
  }

  async _tick() {
    const now = Date.now();
    const s = this.current;
    if (!s) return;

    if (s.status === 'ACTIVE' && now >= s.lockAt) {
      await this.lockSession();
    }

    if (s.status === 'LOCKED' && now >= s.resultsAt) {
      await this.calculateAndAnnounceResults();
    }

    if (now >= s.endsAt) {
      await this.endSessionAndStartNew();
    }
  }

  // Socket handlers
  async handleJoin(socket, { userId } = {}) {
    const uid = userId ?? socket.user?.userId;
    if (!uid) {
      socket.emit("error", { message: "userId missing" });
      return;
    }

    try {
      // --- 1️⃣ Get username from user_profiles ---
      const req = pool.request();
      req.input("user_id", sql.BigInt, uid);

      const result = await req.query(`
        SELECT full_name 
        FROM user_profiles 
        WHERE user_id = @user_id
      `);

      const username =
        result.recordset.length > 0
          ? result.recordset[0].full_name
          : `User${uid}`;

      if(!this.current){
        console.log('No current session');
        await this.startSessionLoop();
        return;
      }
          
      // --- 2️⃣ Add player to current session map ---
      if (!this.current.players.has(uid)) {
        this.current.players.set(uid, new Set());
      }
      this.current.players.get(uid).add(socket.id);

      // --- 3️⃣ Join socket room ---
      socket.join("GLOBAL_GAME_ROOM");

      // --- 4️⃣ Send current session state to the joined user ---
      socket.emit("session_state", this._serializeSessionForClient());

      // --- 5️⃣ Broadcast updated state to all users ---
      this.emitSessionStateToAll();

      // --- 6️⃣ Emit LIVE UPDATE to all ---
      const currentPlayerCount = this.current.players.size;

      this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
        type: "JOIN",
        username,
        message: `${username} joined the session.`,
        count: currentPlayerCount,
        timestamp: new Date(),
      });

      console.log(`👋 ${username} (userId: ${uid}) joined session`);
    } catch (err) {
      console.error("❌ handleJoin error:", err);
      socket.emit("error", { message: "Failed to join session." });
    }
  }

  async handleLeave(socket) {
    const uid = socket.user?.userId;
    if (!uid) return;
  
    try {
      // --- 1️⃣ Fetch username from user_profiles ---
      const req = pool.request();
      req.input("user_id", sql.BigInt, uid);
  
      const result = await req.query(`
        SELECT full_name 
        FROM user_profiles 
        WHERE user_id = @user_id
      `);
  
      const username =
        result.recordset.length > 0
          ? result.recordset[0].full_name
          : `User${uid}`;

      if(!this.current){
        console.log('No current session');
        await this.startSessionLoop();
        return;
      }
  
      // --- 2️⃣ Update players map ---
      const set = this.current?.players.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          // Keep entry (they may have bids) — W1 allows offline wins.
          // Or remove it if you want to fully drop them:
          // this.current.players.delete(uid);
        }
      }
  
      // --- 3️⃣ Leave global room ---
      socket.leave("GLOBAL_GAME_ROOM");
  
      // --- 4️⃣ Update state ---
      this.emitSessionStateToAll();
  
      // --- 5️⃣ Broadcast live update to everyone ---
      const currentPlayerCount = this.current.players.size;
  
      this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
        type: "LEAVE",
        username,
        message: `${username} left the session.`,
        count: currentPlayerCount,
        timestamp: new Date(),
      });
  
      console.log(`👋 ${username} (userId: ${uid}) left session`);
    } catch (err) {
      console.error("❌ handleLeave error:", err);
      socket.emit("error", { message: "Failed to leave session." });
    }
  }

  handleDisconnect(socket) {
    this.handleLeave(socket);
  }

  // placeBid: stores last bid for user in memory (overwrite previous)
  async handlePlaceBid(socket, payload = {}) {
    const uid = payload.userId ?? socket.user?.userId;
    if (!uid) return socket.emit("bid_rejected", { reason: "userId missing" });
    if (this.current.status !== "ACTIVE")
      return socket.emit("bid_rejected", { reason: "Session not active" });

    const { chosen_number, amount } = payload;
    if (typeof chosen_number !== "number" || !Number.isInteger(chosen_number)) {
      return socket.emit("bid_rejected", { reason: "Invalid chosen_number" });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0)
      return socket.emit("bid_rejected", { reason: "Invalid amount" });

    const userKey = String(uid);

    try {
      // === 1️⃣ Fetch user full name from DB ===
      const req = pool.request();
      req.input("user_id", sql.BigInt, uid);
      const result = await req.query(`
        SELECT full_name 
        FROM user_profiles 
        WHERE user_id = @user_id
      `);

      const username =
        result.recordset.length > 0
          ? result.recordset[0].full_name
          : `User${uid}`;

      // === 2️⃣ Initialize user bids if not exists ===
      if (!this.current.bidsByUser.has(userKey)) {
        this.current.bidsByUser.set(userKey, {});
      }

      const userBids = this.current.bidsByUser.get(userKey);

      // === 3️⃣ If this number already exists, update amount ===
      if (userBids[chosen_number]) {
        userBids[chosen_number].amount = amt;
        userBids[chosen_number].updatedAt = Date.now();
      } else {
        // === Else, add new chosen number ===
        userBids[chosen_number] = { amount: amt, updatedAt: Date.now() };
      }

      this.current.bidsByUser.set(userKey, userBids);

      // === 4️⃣ Track player sockets ===
      const set = this.current.players.get(userKey) || new Set();
      set.add(socket.id);
      this.current.players.set(userKey, set);

      // === 5️⃣ Broadcast bid update to everyone ===
      const currentPlayerCount = this.current.players.size;

      this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
        type: "BID",
        username,
        message: `${username} placed a bid on number ${chosen_number} with ₹${amt}`,
        count: currentPlayerCount,
        chosen_number,
        amount: amt,
        timestamp: new Date(),
      });

      // === 6️⃣ Notify user personally ===
      socket.emit("bid_accepted", { chosen_number, amount: amt });

      // === 7️⃣ Emit new session state ===
      this.emitSessionStateToAll();

      console.log(`🎯 ${username} placed a bid: #${chosen_number} → ₹${amt}`);
    } catch (err) {
      console.error("❌ handlePlaceBid error:", err);
      socket.emit("bid_rejected", { reason: "Error placing bid" });
    }
  }


  handleUpdateBid(socket, payload = {}) {
    // same as placeBid for this rule
    return this.handlePlaceBid(socket, payload);
  }

  async handleDeleteBid(socket, payload = {}) {
    const uid = payload.userId ?? socket.user?.userId;
    if (!uid)
      return socket.emit("bid_delete_failed", { reason: "userId missing" });
    if (this.current.status !== "ACTIVE")
      return socket.emit("bid_delete_failed", { reason: "Session not active" });
  
    const { chosen_number } = payload;
    if (typeof chosen_number !== "number" || !Number.isInteger(chosen_number)) {
      return socket.emit("bid_delete_failed", { reason: "Invalid chosen_number" });
    }
  
    const userKey = String(uid);
    const userBids = this.current.bidsByUser.get(userKey);
  
    if (!userBids || !userBids[chosen_number]) {
      return socket.emit("bid_delete_failed", { reason: "Bid not found" });
    }
  
    try {
      // === 1️⃣ Fetch user full name from DB ===
      const req = pool.request();
      req.input("user_id", sql.BigInt, uid);
      const result = await req.query(`
        SELECT full_name 
        FROM user_profiles 
        WHERE user_id = @user_id
      `);
  
      const username =
        result.recordset.length > 0
          ? result.recordset[0].full_name
          : `User${uid}`;
  
      // === 2️⃣ Remove the chosen number ===
      delete userBids[chosen_number];
  
      // === 3️⃣ Clean up bids map ===
      if (Object.keys(userBids).length === 0) {
        this.current.bidsByUser.delete(userKey);
      } else {
        this.current.bidsByUser.set(userKey, userBids);
      }
  
      // === 4️⃣ Emit personal confirmation ===
      socket.emit("bid_deleted", { chosen_number });
  
      // === 5️⃣ Broadcast new state to everyone ===
      this.emitSessionStateToAll();
  
      // === 6️⃣ Send live update to all users ===
      const currentPlayerCount = this.current.players.size;
  
      this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
        type: "BID_DELETE",
        username,
        message: `${username} removed their bid on number ${chosen_number}.`,
        count: currentPlayerCount,
        chosen_number,
        timestamp: new Date(),
      });
  
      console.log(`🗑️ ${username} deleted bid on number ${chosen_number}`);
    } catch (err) {
      console.error("❌ handleDeleteBid error:", err);
      socket.emit("bid_delete_failed", { reason: "Error deleting bid" });
    }
  }


  // Locking: persist bids and mark status
  async lockSession() {
    const s = this.current;
    if (!s || s.status !== 'ACTIVE') return;
    s.status = 'LOCKED';
    // immediate persist of session row and current bids
    try {
      await this.persistSessionAndBids(s);
      this.io.to('GLOBAL_GAME_ROOM').emit('session_locked', { sessionId: s.sessionId });
      this.emitSessionStateToAll();

      this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
        type: "SESSION",
        message: `Session Locked!`,
      });

      console.log('Session locked and persisted.');
    } catch (err) {
      console.error('Error persisting bids at lock:', err);
      // still continue to calculate results; but you may want to handle retries
      this.io.to('GLOBAL_GAME_ROOM').emit('session_locked', { sessionId: s.sessionId, warning: 'persist_error' });
      this.emitSessionStateToAll();
    }
  }

  // Persist session metadata and bids into DB using your schema
  async persistSessionAndBids(s) {
    // Persist a row to game_sessions and then insert all bids rows
    // We'll use a transaction to ensure atomicity
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const req = tx.request();
      // Insert session metadata; we will use the DB sequence to generate session_id
      // Use OUTPUT to get inserted session_id
      const insertSessionSql = `
        INSERT INTO game_sessions (session_start, session_end, bidding_end, created_at)
        OUTPUT INSERTED.session_id
        VALUES (GETDATE(), DATEADD(ms, @sessionMs, GETDATE()), DATEADD(ms, @activeMs, GETDATE()), GETDATE())
      `;
      req.input('sessionMs', sql.BigInt, this.SESSION_MS);
      req.input('activeMs', sql.BigInt, this.ACTIVE_MS);
      const inserted = await req.query(insertSessionSql);
      const dbSessionId = inserted.recordset?.[0]?.session_id;
      if (!dbSessionId) throw new Error('Failed to insert game_sessions');

      // Bulk insert bids (one row per user) using table-valued approach or batched insert
      // Simpler: build a single INSERT with multiple values (careful with many users)
      const bids = [];
      for (const [userId, userBids] of s.bidsByUser.entries()) {
        for (const [num, b] of Object.entries(userBids)) {
          bids.push({
            userId: BigInt(userId),
            chosenNumber: Number(num),
            amount: b.amount,
            createdAt: new Date(b.updatedAt)
          });
        }
      }

      if (bids.length > 0) {
        // Create TVP-like temp table approach is best; if not available, do batched inserts
        // We'll do a batched insert with parameterized queries (safe)
        // Build multi-row insert
        const columnsSql = '[session_id], [user_id], [chosen_number], [amount], [created_at]';
        const values = [];
        const parameters = {};
        bids.forEach((row, idx) => {
          const idxSuffix = idx;
          const pUser = `user${idxSuffix}`;
          const pChosen = `chosen${idxSuffix}`;
          const pAmount = `amount${idxSuffix}`;
          const pCreated = `created${idxSuffix}`;
          values.push(`(@pSessionId, @${pUser}, @${pChosen}, @${pAmount}, @${pCreated})`);
          parameters[pUser] = { type: sql.BigInt, value: row.userId };
          parameters[pChosen] = { type: sql.Int, value: row.chosenNumber };
          parameters[pAmount] = { type: sql.Decimal(10,2), value: row.amount };
          parameters[pCreated] = { type: sql.DateTime2, value: row.createdAt };
        });

        // attach session id param
        req.input('pSessionId', sql.BigInt, dbSessionId);

        // ✅ Define all dynamic params
        Object.entries(parameters).forEach(([key, param]) => {
          req.input(key, param.type, param.value);
        });
      
        const valuesSql = values.join(', ');
        const query = `
          INSERT INTO bids (${columnsSql})
          VALUES ${valuesSql};
        `;
      
        await req.query(query);
      }

      await tx.commit();

      // store dbSessionId so we can reference later
      s.dbSessionId = dbSessionId;
      console.log('Persisted session and bids. session_id:', dbSessionId);
      this.emitSessionStateToAll();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  // calculate result, save session_results and session_user_results, payouts
  async calculateAndAnnounceResults() {
    const s = this.current;
    if (!s || s.status !== "LOCKED") return;
    s.status = "COMPUTING_RESULTS";
    
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: "Computing Results!!",
    });

    /*
    // === STEP 1: Generate 6 random dice results ===
    const results = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);

    // Count occurrences of each number (1-6)
    const resultCounts = {};
    for (const n of results) {
      resultCounts[n] = (resultCounts[n] || 0) + 1;
    }
    */

    // === STEP 1: Use pre-generated dice results from session ===
    const results = s.results;
    const resultCounts = s.resultCounts;

    console.log("🎲 Computed Results:", results, "Counts:", resultCounts);

    // === STEP 2: Compute per-user winnings ===
    const userResults = [];
    const userNetMap = new Map(); // 👈 store total net per user

    for (const [uid, userBids] of s.bidsByUser.entries()) {
      let totalPayout = 0;
      let totalBid = 0;
    
      for (const [num, b] of Object.entries(userBids)) {
        const chosenNum = Number(num);
        const count = resultCounts[chosenNum] || 0;
        const amount = Number(b.amount);
        
        let payout = 0;
        if (chosenNum === 7) {
          const uniqueResults = Object.keys(resultCounts).length;
          payout = uniqueResults === 6 ? (amount * 6) + amount : 0;
        } else {
          payout = count > 1 ? (amount * count)+amount : 0;
        }
      
        totalBid += amount;
        totalPayout += payout;
      
        userResults.push({
          userId: BigInt(uid),
          chosenNumber: chosenNum,
          amount,
          isWinner: count > 1 ? 1 : 0,
          payout,
          multiplier: count,
        });
      }

      // Store net (totalPayout - totalBid)
      userNetMap.set(uid, totalPayout - totalBid);

      // Send personal result immediately
      const socketIds = s.players.get(String(uid));
      const payload = {
        sessionId: s.sessionId,
        dbSessionId: s?.dbSessionId,
        userId: uid,
        results,
        totalPayout,
        totalBid,
        net: totalPayout - totalBid,
      };
      if (socketIds) {
        for (const sid of socketIds) {
          this.io.to(sid).emit("personal_result_preview", payload);
        }
      }
    }

    //console.log('userResults : ', userResults);
    //console.log('userNetMap : ', userNetMap);

    // Emit results to everyone for UI display
    this.io.to("GLOBAL_GAME_ROOM").emit("announce_result_preview", {
      sessionId: s.sessionId,
      results,
      status: "RESULTS",
    });
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      results,
      message: `Results Declared!`,
    });

    // === STEP 3: Persist results & update wallets ===
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const req = tx.request();
    
      // If persisted session missing, insert one
      let dbSessionId = s.dbSessionId;
      if (!dbSessionId) {
        req.input("sessionMs", sql.BigInt, this.SESSION_MS);
        req.input("activeMs", sql.BigInt, this.ACTIVE_MS);
        const inserted = await req.query(`
          INSERT INTO game_sessions (session_start, session_end, bidding_end, created_at)
          OUTPUT INSERTED.session_id
          VALUES (GETDATE(), DATEADD(ms, @sessionMs, GETDATE()), DATEADD(ms, @activeMs, GETDATE()), GETDATE())
        `);
        dbSessionId = inserted.recordset?.[0]?.session_id;
      }
    
      const w_num = results.join(''); // e.g. "134523"
      req.input("sessionId", sql.BigInt, dbSessionId);
      req.input("w_num", sql.VarChar(20), w_num);

      await req.query(`
        INSERT INTO session_results (session_id, winning_number, declared_at)
        VALUES (@sessionId, @w_num, GETDATE())
      `);

      // === STEP 4: Insert user results ===
      for (let i = 0; i < userResults.length; i++) {
        const r = userResults[i];
        req.input(`u_userId${i}`, sql.BigInt, r.userId);
        req.input(`u_chosen${i}`, sql.Int, r.chosenNumber);
        req.input(`u_amount${i}`, sql.Decimal(10, 2), r.amount);
        req.input(`u_isWin${i}`, sql.Bit, r.isWinner);
        req.input(`u_payout${i}`, sql.Decimal(10, 2), r.payout);
      
        await req.query(`
          INSERT INTO session_user_results (session_id, user_id, chosen_number, amount, is_winner, payout, created_at)
          VALUES (@sessionId, @u_userId${i}, @u_chosen${i}, @u_amount${i}, @u_isWin${i}, @u_payout${i}, GETDATE())
        `);
      }

      // === STEP 5: Single wallet transaction per user ===
      for (const [uid, net] of userNetMap.entries()) {
        const netValue = Number(net);
        // req.input(`net_${uid}`, sql.Decimal(10, 2), Math.abs(netValue));

        // Update wallet balance
        await req.query(`
          UPDATE wallets
          SET balance = balance + ${netValue}, last_updated = GETDATE()
          WHERE user_id = ${uid}
        `);
        // Insert single SYSTEM transaction with net result
        await req.query(`
          INSERT INTO wallet_transactions (wallet_id, txn_type, amount, reference_id, created_at)
          SELECT wallet_id, 'SYSTEM', ${netValue}, @sessionId, GETDATE()
          FROM wallets WHERE user_id = ${uid}
        `);
      }

      await tx.commit();
      console.log("✅ Results settled for session", dbSessionId);
    } catch (err) {
      await tx.rollback();
      console.error("❌ Error saving results/payouts", err);
    }

    // === STEP 6: Final announce - settlement complete ===
    s.status = "SETTLED";
    this.emitSessionStateToAll();
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: `Wallets updated! Please check.`,
    });
  }

  // end session, cleanup and start new
  async endSessionAndStartNew() {
    // gracefully end old session
    const old = this.current;
    if (!old) {
      console.log('endSessionAndStartNew called but there is no current session.');
      return;
    }

    old.status = 'ENDED';
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: `Session Ended`,
    });
    this.emitSessionStateToAll();

    console.log('Ending session', old.sessionId);
    console.log('Ending on : ', new Date(moment.now()));
    
    // clear batch timer (we will decide whether to start new ones)
    clearInterval(this.batchTimer);

    // BEFORE creating a new session, check DB switch
    let active = false;
    try {
      active = await this.checkIfActive();
    } catch (err) {
      console.error('Error checking game_control flag, defaulting to inactive.', err);
      active = false;
    }
    console.log('active flag : ', active);
    if (!active) {
      // Do NOT start a new session. Put server in paused state.
      this.io.to("GLOBAL_GAME_ROOM").emit("new_session", { message: "Game paused by admin" });
      console.log('GameControl is OFF — not starting new session.');
      // Optionally keep this.current = null to indicate no active session in memory
      // this.current = null;
      // this.emitSessionStateToAll();
      return;
    }

    this.current = this.createSession();
    this.batchTimer = setInterval(() => this.batchWriteBids(), this.BATCH_WRITE_INTERVAL_MS);
    this.io.to('GLOBAL_GAME_ROOM').emit('new_session', this._serializeSessionForClient());
    console.log('New session started', this.current.sessionId);
    console.log('Staretd on : ', new Date(moment.now()));
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: `New Session Started.`,
    });
    this.emitSessionStateToAll();
  }

  // batch persistence stub (we already persist on lock)
  async batchWriteBids() {
    // optional: persist incremental info periodically to reduce lost-data risk
    // For simplicity, no-op here (we persist on lock)
    return;
  }
}

export default GameSession;