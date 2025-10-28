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

    this.SESSION_MINUTES = opts.totalMinutes ?? 15;
    this.ACTIVE_MINUTES = opts.activeMinutes ?? 10;
    this.LOCKED_MINUTES = opts.lockedMinutes ?? 2;
    this.RESULTS_MINUTES = this.SESSION_MINUTES - this.ACTIVE_MINUTES - this.LOCKED_MINUTES;

    this.SESSION_MS = this.SESSION_MINUTES * 60 * 1000;
    this.ACTIVE_MS = this.ACTIVE_MINUTES * 60 * 1000;
    this.LOCKED_MS = this.LOCKED_MINUTES * 60 * 1000;
    this.BATCH_WRITE_INTERVAL_MS = opts.batchWriteIntervalMs ?? 30 * 1000;

    // in-memory state
    // bidsByUser: Map<userId, { chosen_number, amount, updatedAt }>
    this.current = null;
    this.batchTimer = null;
    this.tickInterval = null;

    this.startSessionLoop();
  }

  // create empty session
  createSession() {
    const now = Date.now();
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
    };
  }

  startSessionLoop() {
    this.current = this.createSession();
    this.emitSessionStateToAll();

    this.batchTimer = setInterval(() => this.batchWriteBids(), this.BATCH_WRITE_INTERVAL_MS);
    this.tickInterval = setInterval(() => this._tick(), 1000);
    console.log('GameSession started', this.current.sessionId);
  }

  _serializeSessionForClient() {
    const s = this.current;
    const now = Date.now();
    const remainingMs = Math.max(0, s.endsAt - now);
    const remainingActiveMs = Math.max(0, s.lockAt - now);
    // compute bid summary per chosen_number
    const summary = {};
    for (const [userId, b] of s.bidsByUser.entries()) {
      if (!summary[b.chosen_number]) summary[b.chosen_number] = { totalAmount: 0, count: 0 };
      summary[b.chosen_number].totalAmount = Number(summary[b.chosen_number].totalAmount) + Number(b.amount);
      summary[b.chosen_number].count += 1;
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
      playersCount: s.players.size
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
  handleJoin(socket, { userId } = {}) {
    const uid = userId ?? socket.user?.userId;
    if (!uid) {
      socket.emit('error', { message: 'userId missing' });
      return;
    }
    this.current.players.set(uid, (this.current.players.get(uid) || new Set()).add(socket.id));
    socket.join('GLOBAL_GAME_ROOM');
    // send full state (R1)
    socket.emit('session_state', this._serializeSessionForClient());
  }

  handleLeave(socket) {
    const uid = socket.user?.userId;
    if (!uid) return;
    const set = this.current.players.get(uid);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        // keep player entry (they may have bids) — W1 allows offline wins.
      }
    }
    socket.leave('GLOBAL_GAME_ROOM');
  }

  handleDisconnect(socket) {
    this.handleLeave(socket);
  }

  // placeBid: stores last bid for user in memory (overwrite previous)
  handlePlaceBid(socket, payload = {}) {
    const uid = payload.userId ?? socket.user?.userId;
    if (!uid) return socket.emit('bid_rejected', { reason: 'userId missing' });
    if (this.current.status !== 'ACTIVE') return socket.emit('bid_rejected', { reason: 'Session not active' });

    const { chosen_number, amount } = payload;
    if (typeof chosen_number !== 'number' || !Number.isInteger(chosen_number)) {
      return socket.emit('bid_rejected', { reason: 'Invalid chosen_number' });
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return socket.emit('bid_rejected', { reason: 'Invalid amount' });

    // Save last bid per user (override previous)
    this.current.bidsByUser.set(String(uid), { chosen_number, amount: amt, updatedAt: Date.now() });

    // ensure players map tracks sockets
    const set = this.current.players.get(String(uid)) || new Set();
    set.add(socket.id);
    this.current.players.set(String(uid), set);

    // broadcast summary update
    this.io.to('GLOBAL_GAME_ROOM').emit('session_update', this._serializeSessionForClient());
    socket.emit('bid_accepted', { chosen_number, amount: amt });
  }

  handleUpdateBid(socket, payload = {}) {
    // same as placeBid for this rule
    return this.handlePlaceBid(socket, payload);
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
      console.log('Session locked and persisted.');
    } catch (err) {
      console.error('Error persisting bids at lock:', err);
      // still continue to calculate results; but you may want to handle retries
      this.io.to('GLOBAL_GAME_ROOM').emit('session_locked', { sessionId: s.sessionId, warning: 'persist_error' });
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
      const bids = Array.from(s.bidsByUser.entries()).map(([userId, b]) => ({
        userId: BigInt(userId),
        chosenNumber: b.chosen_number,
        amount: b.amount,
        createdAt: new Date(b.updatedAt)
      }));

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
          values.push(`(@${pSessionId}, @${pUser}, @${pChosen}, @${pAmount}, @${pCreated})`);
          parameters[pUser] = { type: sql.BigInt, value: row.userId };
          parameters[pChosen] = { type: sql.Int, value: row.chosenNumber };
          parameters[pAmount] = { type: sql.Decimal(10,2), value: row.amount };
          parameters[pCreated] = { type: sql.DateTime2, value: row.createdAt };
        });

        // attach session id param
        req.input('pSessionId', sql.BigInt, dbSessionId);

        // attach other params
        let loopIndex = 0;
        for (const [paramName, p] of Object.entries(parameters)) {
          req.input(paramName, p.type, p.value);
          loopIndex++;
        }

        const insertBidsSql = `INSERT INTO bids (session_id, user_id, chosen_number, amount, created_at) VALUES ${values.join(', ')}`;
        await req.query(insertBidsSql);
      }

      await tx.commit();

      // store dbSessionId so we can reference later
      s.dbSessionId = dbSessionId;
      console.log('Persisted session and bids. session_id:', dbSessionId);
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  // calculate result, save session_results and session_user_results, payouts
  async calculateAndAnnounceResults() {
    const s = this.current;
    if (!s || s.status !== 'LOCKED') return;
    s.status = 'COMPUTING_RESULTS';

    // Simple compute: pick winning_number randomly among numbers that received bids.
    const numberTotals = new Map(); // chosen_number -> total amount
    for (const [uid, b] of s.bidsByUser.entries()) {
      const num = b.chosen_number;
      const prev = numberTotals.get(num) || 0;
      numberTotals.set(num, prev + Number(b.amount));
    }

    // needs to update
    const candidateNumbers = Array.from(numberTotals.keys());
    const winningNumber = candidateNumbers.length ? candidateNumbers[Math.floor(Math.random() * candidateNumbers.length)] : 1;

    // Build per-user result rows
    const userResults = [];
    for (const [uid, b] of s.bidsByUser.entries()) {
      const isWinner = winningNumber !== null && b.chosen_number === winningNumber;
      // payout logic — simple example: winners get amount * 2 (you should change to real odds)
      const payout = isWinner ? Number(b.amount) * 2 : 0;
      userResults.push({
        userId: BigInt(uid),
        chosenNumber: b.chosen_number,
        amount: b.amount,
        isWinner: isWinner ? 1 : 0,
        payout
      });
    }

    // Persist results & payouts in a transaction: session_results, session_user_results, wallet_transactions & wallets update
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const req = tx.request();
      // Insert session_results (use inserted session id if exists, else rely on sequence)
      // If we persisted session row already on lock, s.dbSessionId exists
      let dbSessionId = s.dbSessionId;
      if (!dbSessionId) {
        // Insert session again fallback
        const inserted = await req.query(`
          INSERT INTO game_sessions (session_start, session_end, bidding_end, created_at)
          OUTPUT INSERTED.session_id
          VALUES (GETDATE(), DATEADD(ms, @sessionMs, GETDATE()), DATEADD(ms, @activeMs, GETDATE()), GETDATE())
        `);
        dbSessionId = inserted.recordset?.[0]?.session_id;
      }

      req.input('sessionId', sql.BigInt, dbSessionId);
      req.input('winningNumber', sql.Int, winningNumber);

      await req.query(`
        INSERT INTO session_results (session_id, winning_number, declared_at)
        VALUES (@sessionId, @winningNumber, GETDATE())
      `);

      // Insert session_user_results and apply wallet updates + wallet_transactions
      for (let i = 0; i < userResults.length; i++) {
        const r = userResults[i];
        req.input(`u_userId${i}`, sql.BigInt, r.userId);
        req.input(`u_chosen${i}`, sql.Int, r.chosenNumber);
        req.input(`u_amount${i}`, sql.Decimal(10,2), r.amount);
        req.input(`u_isWin${i}`, sql.Bit, r.isWinner);
        req.input(`u_payout${i}`, sql.Decimal(10,2), r.payout);

        await req.query(`
          INSERT INTO session_user_results (session_id, user_id, chosen_number, amount, is_winner, payout, created_at)
          VALUES (@sessionId, @u_userId${i}, @u_chosen${i}, @u_amount${i}, @u_isWin${i}, @u_payout${i}, GETDATE())
        `);

        // If payout > 0, credit wallet (simple example)
        if (Number(r.payout) > 0) {
          // Update wallets balance
          await req.query(`
            UPDATE wallets
            SET balance = balance + @u_payout${i}, last_updated = GETDATE()
            WHERE user_id = @u_userId${i}
          `);

          // Insert wallet transaction for payout (reference_id -> session id)
          await req.query(`
            INSERT INTO wallet_transactions (wallet_id, txn_type, amount, reference_id, created_at)
            SELECT wallet_id, 'SYSTEM', @u_payout${i}, @sessionId, GETDATE()
            FROM wallets WHERE user_id = @u_userId${i}
          `);
        } else {
          // you may want to insert a losing transaction or not; optional
        }
      }

      await tx.commit();
      console.log('Results saved and wallets updated for session', dbSessionId);
    } catch (err) {
      await tx.rollback();
      console.error('Error saving results/payouts', err);
      // optionally: persist to file / queue for retry
    }

    // Broadcast results
    this.io.to('GLOBAL_GAME_ROOM').emit('announce_result', {
      sessionId: s.sessionId,
      winningNumber,
      summary: {
        totalPlayers: s.bidsByUser.size,
        totalAmount: Array.from(s.bidsByUser.values()).reduce((sum, b) => sum + Number(b.amount), 0)
      }
    });

    // Personal results: send to connected sockets; offline users can be later notified via other channels
    for (const [uid, b] of s.bidsByUser.entries()) {
      const isWin = b.chosen_number === winningNumber;
      const payload = {
        sessionId: s.sessionId,
        userId: uid,
        chosenNumber: b.chosen_number,
        amount: b.amount,
        isWinner: isWin,
        payout: isWin ? Number(b.amount) * 2 : 0
      };
      const socketIds = s.players.get(String(uid));
      if (socketIds) {
        for (const sid of socketIds) {
          this.io.to(sid).emit('personal_result', payload);
        }
      } else {
        // offline — they still win/lose; you persisted session_user_results & wallet tx above per W1
      }
    }

    s.status = 'RESULTS';
  }

  // end session, cleanup and start new
  async endSessionAndStartNew() {
    const old = this.current;
    console.log('Ending session', old.sessionId);
    console.log('Ending on : ', new Date(moment.now()));
    // clear timers if any
    // reset in-memory and start a new session
    clearInterval(this.batchTimer);
    this.current = this.createSession();
    this.batchTimer = setInterval(() => this.batchWriteBids(), this.BATCH_WRITE_INTERVAL_MS);
    this.io.to('GLOBAL_GAME_ROOM').emit('new_session', this._serializeSessionForClient());
    console.log('New session started', this.current.sessionId);
    console.log('Staretd on : ', new Date(moment.now()));
  }

  // batch persistence stub (we already persist on lock)
  async batchWriteBids() {
    // optional: persist incremental info periodically to reduce lost-data risk
    // For simplicity, no-op here (we persist on lock)
    return;
  }
}

export default GameSession;