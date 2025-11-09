import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import logo from "../../gallery/logo.svg";
import { IoLockClosed, IoTrash } from "react-icons/io5";
import GameMusicPlayer from "./GameMusicPlayer";

function Dummy() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // === State Variables ===
  const [quitModel, setQuitModel] = useState(false);
  const [isQuit, setQuit] = useState(false);
  const [bidModal, setBidModal] = useState(false);
  const [chosen, setChosen] = useState(0);
  const [amount, setAmount] = useState("");
  const [bids, setBids] = useState({});
  const [isParticipated, setIsParticipated] = useState(false);

  const [sessionState, setSessionState] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [activeTimeLeft, setActiveTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);

  const resetForNewSession = () => {
    console.log("🔄 New session detected — resetting game state");
    setChosen(0);
    setBids({});
    setAmount("");
    setIsParticipated(false);
  };

  // === Lifecycle: Mount / Unmount ===
  useEffect(() => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    const socket = io("http://localhost:8080", {
      auth: { token: `Bearer ${token}` },
    });
    socketRef.current = socket;

    // Join session
    socket.emit("join_session", { userId });

    // Listen for session updates
    socket.on("session_state", (data) => {
      if (sessionState && data.session_id !== sessionState.session_id) {
        resetForNewSession();
        socket.emit("join_session", { userId });
      }
      setSessionState(data);
      setIsActive(data.status === "ACTIVE");

      const now = Date.now();
      setActiveTimeLeft(new Date(data.lockAt).getTime() - now);
      setTotalTimeLeft(new Date(data.endsAt).getTime() - now);
    });

    // Listen for bid confirmations
    socket.on("bid_accepted", ({ chosen_number, amount }) => {
      console.log(`✅ Bid accepted for ${chosen_number}: Rs.${amount}`);
    });

    socket.on("bid_deleted", ({ chosen_number }) => {
      console.log(`❌ Bid deleted for number ${chosen_number}`);
    });

    socket.on("bid_rejected", (msg) => console.warn("Bid rejected:", msg));
    socket.on("bid_delete_failed", (msg) =>
      console.warn("Delete failed:", msg)
    );

    return () => {
      socket.emit("leave_session");
      socket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    if (sessionState) console.log("SessionState:", sessionState);
  }, [sessionState]);

  // === Timer Effects ===
  useEffect(() => {
    if (activeTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setActiveTimeLeft((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimeLeft]);

  useEffect(() => {
    if (totalTimeLeft <= 0) {
      setChosen(0);
      setBids({});
      setAmount("");
      setIsParticipated(false);
      return;
    }
    const interval = setInterval(() => {
      setTotalTimeLeft((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [totalTimeLeft]);

  // === Quit Logic ===
  const handleQuit = () => {
    setQuitModel(false);
    setQuit(true);
    if (socketRef.current) {
      socketRef.current.emit("leave_session");
      socketRef.current.disconnect();
    }
  };

  useEffect(() => {
    if (isQuit) navigate("/app/dashboard");
  }, [isQuit, navigate]);

  // === Timer Formatter ===
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // === 🎯 Bidding Methods ===

  /** Open modal to place or update bid */
  const handleNumberClick = (e, number) => {
    e.preventDefault();
    if (!isActive) return;
    setChosen(number);
    setAmount(bids[number] || ""); // Preload if updating
    setBidModal(true);
  };

  /** Cancel bid modal */
  const cancelBid = (e) => {
    e.preventDefault();
    setBidModal(false);
    setChosen(null);
    setAmount("");
  };

  /** Place or update bid (emit to server) */
  const handleBid = (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return;

    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("userId");

    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const chosen_number = chosen;
    const payload = {
      userId,
      chosen_number,
      amount: Number(amount),
    };

    // Emit bid to backend
    socket.emit("place_bid", payload);

    // Local update (optimistic)
    setBids((prev) => ({
      ...prev,
      [chosen_number]: Number(amount),
    }));

    setBidModal(false);
    setChosen(null);
    setAmount("");
    setIsParticipated(true);
  };

  /** Delete a bid (emit to server) */
  const handleDeleteBid = (num) => {
    const socket = socketRef.current;
    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("userId");

    const payload = {
      userId,
      chosen_number: Number(num),
    };

    socket.emit("delete_bid", payload);

    // Local update (optimistic)
    const updated = { ...bids };
    delete updated[num];
    setBids(updated);
    if (Object.keys(updated).length === 0) setIsParticipated(false);
  };

  // === Waiting Screen ===
  if (!isActive && !isParticipated) {
    return (
      <div className="empty-timer">
        <h3>Next game starts in {formatTime(totalTimeLeft)}</h3>
        <h3>Please wait...</h3>
        <div className="controls">
          <button onClick={handleQuit} className="quit-game-btn">
            Quit Game
          </button>
          <GameMusicPlayer />
        </div>
      </div>
    );
  }

  // === Main UI ===
  return (
    <div className="game-outer number-game">
      {isQuit && (
        <div className="modal">
          <h1 className="quit-text">Quit...</h1>
        </div>
      )}

      {quitModel && (
        <div className="modal quit-modal">
          <div className="quit-modal-container">
            <h3>Are you sure you want to quit?</h3>
            <div className="quit-modal-controls">
              <button className="quit-btn-no" onClick={() => setQuitModel(false)}>
                No
              </button>
              <button className="quit-btn-yes" onClick={handleQuit}>
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {bidModal && (
        <div className="modal bid-modal">
          <div className="quit-modal-container">
            <h3>You selected number {chosen}</h3>
            <h5>Enter Amount</h5>
            <div className="input-container">
              <span>Rs.</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="quit-modal-controls">
              <button className="quit-btn-no" onClick={cancelBid}>
                Cancel
              </button>
              <button className="quit-btn-yes" onClick={handleBid}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <div className="game-logo">
          <img src={logo} alt="logo" />
        </div>
        <div className="quit-control">
          <GameMusicPlayer />
          <button className="quit-btn" onClick={() => setQuitModel(true)}>
            Quit Game
          </button>
        </div>
      </div>

      <div className="game-body">
        <div className="game-upper-body">
          <div className="session-timer">
            <h3>
              {isActive
                ? `Bidding ends in ${formatTime(activeTimeLeft)}`
                : `Session Locked! Next session starts in ${formatTime(
                    totalTimeLeft
                  )}`}
            </h3>
          </div>

          {isParticipated && (
            <div className="bid-pop">
              {Object.entries(bids).map(([num, amt]) => (
                <div key={num} className="bid-chip">
                  <p className="num">{num}</p>
                  <p className="amt">Rs. {amt}/-</p>
                  {isActive && (
                    <IoTrash
                      className="icon-trash"
                      onClick={() => handleDeleteBid(num)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="game-lower-body">
          <div className="game-board-outer">
            <div className="game-board">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className={`game-board-number number${num} ${
                    bids[num] ? "chosen" : ""
                  }`}
                  onClick={(e) => handleNumberClick(e, num)}
                >
                  <h1>{num}</h1>
                  {bids[num] && <IoLockClosed />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dummy;
