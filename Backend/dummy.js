// per bid transactions to wallet code
async calculateAndAnnounceResults() {
    const s = this.current;
    if (!s || s.status !== "LOCKED") return;
    s.status = "COMPUTING_RESULTS";
    
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: "Computing Results!!",
    });
  
    // === STEP 1: Generate 6 random dice results ===
    const results = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);
  
    // Count occurrences of each number (1-6)
    const resultCounts = {};
    for (const n of results) {
      resultCounts[n] = (resultCounts[n] || 0) + 1;
    }
  
    console.log("🎲 Computed Results:", results, "Counts:", resultCounts);
  
    // === STEP 2: Compute per-user winnings ===
    const userResults = [];
  
    for (const [uid, userBids] of s.bidsByUser.entries()) {
      let totalPayout = 0;
      let totalBid = 0;
    
      // Each userBids is an object { number: { amount } }
      for (const [num, b] of Object.entries(userBids)) {
        const chosenNum = Number(num);
        const count = resultCounts[chosenNum] || 0;
        const amount = Number(b.amount);
        const payout = count > 0 ? amount * count : -amount;
      
        totalBid += amount;
        totalPayout += payout;
      
        userResults.push({
          userId: BigInt(uid),
          chosenNumber: chosenNum,
          amount,
          isWinner: count > 0 ? 1 : 0,
          payout,
          multiplier: count,
        });
      }
    
      // Send personal result immediately
      const socketIds = s.players.get(String(uid));
      const payload = {
        sessionId: s.sessionId,
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

      // === STEP 4: Insert user results and update wallets ===
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
        
        if (Number(r.payout) > 0) {
          // 🟢 Winner - Credit wallet
          await req.query(`
            UPDATE wallets
            SET balance = balance + @u_payout${i}, last_updated = GETDATE()
            WHERE user_id = @u_userId${i}
          `);
          await req.query(`
            INSERT INTO wallet_transactions (wallet_id, txn_type, amount, reference_id, created_at)
            SELECT wallet_id, 'CREDIT_WIN', @u_payout${i}, @sessionId, GETDATE()
            FROM wallets WHERE user_id = @u_userId${i}
          `);
        } else {
          // 🔴 Loser - Deduct bid amount
          await req.query(`
            UPDATE wallets
            SET balance = balance - ABS(@u_payout${i}), last_updated = GETDATE()
            WHERE user_id = @u_userId${i}
          `);
          await req.query(`
            INSERT INTO wallet_transactions (wallet_id, txn_type, amount, reference_id, created_at)
            SELECT wallet_id, 'DEBIT_LOSS', @u_payout${i}, @sessionId, GETDATE()
            FROM wallets WHERE user_id = @u_userId${i}
          `);
        }
      }
    
      await tx.commit();
      console.log("✅ Results settled for session", dbSessionId);
    } catch (err) {
      await tx.rollback();
      console.error("❌ Error saving results/payouts", err);
    }
  
    // === STEP 5: Final announce - settlement complete ===
    s.status = "SETTLED";
    this.emitSessionStateToAll();
    this.io.to("GLOBAL_GAME_ROOM").emit("live_update", {
      type: "SESSION",
      message: `Wallets updated! Please check.`,
    });

  }