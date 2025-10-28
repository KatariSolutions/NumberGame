import { v4 as uuidv4 } from 'uuid';
import { pool, sql } from'./db.js';
import moment from moment;

class GameSession2 {
    constructor (io, opts={}) {
        this.io = io;

        this.SESSION_MINUTES = opts.totalMinutes ?? 15;
        this.ACTIVE_MINUTES = opts.acitveMinutes ?? 10;
        this.LOCKED_MINUTES = opts.lockedMinutes ?? 2;
        this.RESULTS_MINUTES = this.SESSION_MINUTES - this.ACTIVE_MINUTES - this.LOCKED_MINUTES;

        this.SESSION_MS = this.SESSION_MINUTES * 60 * 1000;
        this.ACTIVE_MS = this.ACTIVE_MINUTES * 60 * 1000;
        this.LOCKED_MS = this.LOCKED_MINUTES * 60 * 1000;
        this.BATCH_WRITE_INTERVAL_MS = opts.batchWriteIntervalMs ?? 30 * 1000;

        this.current = null;
        this.batchTimer = null;
        this.tickInterval = null;

        this.startSessionLoop();
    }

    createSession() {
        const now = Date.now();
        return {
            sessionId: uuidv4(),
            startedAt: now,
            status: 'ACTIVE',
            endsAt: now + this.SESSION_MS,
            lockAt: now + this.ACTIVE_MS,
            resultsAt: now + this.ACTIVE_MS + this.LOCKED_MS,
            bidsByUser: new Map(),
            players: new Map(),
        }
    }

    startSessionLoop() {
        this.current = this.createSession();
        this.emitSessionStateToAll();

        this.batchTimer = setInterval(()=> this.batchWriteBids(), this.BATCH_WRITE_INTERVAL_MS);
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
        if(!s) return;

        if (s.status === 'ACTIVE' && now >= s.lockAt) {
            await this.lockSession();
        }

        if(s.status === 'LOCKED' && now >= s.resultsAt) {
            await this.calculateAndAnnounceResults();
        }

        if (now >= s.endsAt) {
            await this.endSessionAndStartNew();
        }
    }

    async lockSession() {
        const s = this.current;
        if (!s || s.status !== 'ACTIVE') return;
        s.status = 'LOCKED';

        try {
            await this.persistSessionAndBids(s);
            this.io.to('GLOBAL_GAME_ROOM').emit('session_leaked', {sessionId : s.sessionId});
            console.log('Session locked and persisted.');
        } catch (err) {
            console.log('Error persisting bids at lock: ', err);
            this.io.to('GLOBAL_GAME_ROOM').emit('session_locked', {sessionId : s.sessionId, warning: 'persist_error'});
        }
    }
}