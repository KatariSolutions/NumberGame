import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import logo from "../../gallery/logo.svg";
import { IoTrash, IoClose } from "react-icons/io5";
import { RiCoinsFill } from "react-icons/ri";
import GameMusicPlayer from "./GameMusicPlayer";
import DiceRoll from "./DiceRoll";
import { getWalletBalanceAPI } from "../../apis/wallet/getWalletBalanceAPI";
import { toast } from "react-toastify";

import StaticDice from "./StaticDice";
import Cylinder3D from "../../components/Cylinder3D";

function NumberGame() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const gameServer = "https://numbergameserver.onrender.com";
  //const gameServer = "http://localhost:8080/"

  // === State Variables ===
  const [quitModel, setQuitModel] = useState(false);
  const [isQuit, setQuit] = useState(false);
  const [bidModal, setBidModal] = useState(false);
  const [chosen, setChosen] = useState(0);
  const [amount, setAmount] = useState();
  const [bids, setBids] = useState({});

  const [isActive,setIsActive] = useState(false);
  const [isParticipated,setIsParticipated] = useState(false);
  const isParticipatedRef = useRef(isParticipated);

  // helper to set both state and ref in one place
  const setParticipation = (val) => {
    isParticipatedRef.current = val;
    setIsParticipated(val);
  };

  const [walletBalance, setWalletBalance] = useState(0)

  const [sessionState, setSessionState] = useState(null);
  const [activeTimeLeft, setActiveTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);

  // to capture the live updates from socket
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const [showBidPop, setShowBidPop] = useState(false);
  const [showBidPopModal, setShowBidPopModal] = useState(false);

  // Dice rolling logic
  const [diceResults, setDiceResults] = useState([6, 6, 6, 6, 6, 6]);
  const [rollTrigger, setRollTrigger] = useState(false);
  const [diceRollFinished, setDiceRollFinished] = useState(false);

  const [cylinderAnimate, setCylinderAnimate] = useState(false);
  const [cylinderVisible, setCylinderVisible] = useState(true);
  const [diceLayoutAnimate, setDiceLayoutAnimate] = useState(false);

  const [placeBetPop, setPlaceBetPop] = useState(false);

  // === Reset for new session ===
  const resetForNewSession = () => {
    //console.log("🔄 New session detected — resetting game state");
    setChosen(0);
    setBids({});
    setAmount("");
    setBidModal(false);
    setParticipation(false);
    setLiveUpdates([]);
    setRollTrigger(true);
    setDiceResults([6, 6, 6, 6, 6, 6]);
    setRollTrigger(false);
    setDiceRollFinished(false);
    setCylinderAnimate(false);
    setCylinderVisible(true);
    setDiceLayoutAnimate(false);
    setPlaceBetPop(false);
  };

  // fetch wallet balance from endpoint
  const fetchWalletBalance = async () => {
    const token = 
      sessionStorage.getItem("token") || localStorage.getItem("token");
    const userId =
      sessionStorage.getItem("userId") || localStorage.getItem("userId");
    try{
      const res = await getWalletBalanceAPI(userId, token);
      //console.log(res)
      if(res.status==201){
        const WB = res.result?.balance || 0;
        setWalletBalance(WB);
      } else {
        toast.error("Failed to fetch wallet balance. Try again later!")
      }
    } catch (err) {
      //console.log(err);
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  }

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

    fetchWalletBalance();

    // Connect to backend
    const socket = io(gameServer, {
      auth: { token: `Bearer ${token}` },
    });
    socketRef.current = socket;

    // Join session
    socket.emit("join_session", { userId });

    // Listen for session state updates
    socket.on("session_state", (data) => {
      // 🧹 Detect new session (based on session_id or time reset)
      if (sessionState && data.status === "ENDED") {
        resetForNewSession();
        socket.emit("join_session", { userId }); // 🔁 Rejoin new session
      }

      if (sessionState && data.status === "SETTLED") {
        // future redirect logic here
        setCylinderAnimate(false);
        setCylinderVisible(false);
        setDiceLayoutAnimate(true);
        setDiceRollFinished(true);
        setPlaceBetPop(false);
      }

      setSessionState(data);
      setIsActive(data.status === "ACTIVE");
      if(data.status === "ACTIVE"){
        setCylinderAnimate(true);
        setPlaceBetPop(true);
      }

      const now = Date.now();
      setActiveTimeLeft(new Date(data.lockAt).getTime() - now);
      setTotalTimeLeft(new Date(data.endsAt).getTime() - now);
    });

    socket.on("personal_result_preview", (payload) => {
      // removing session
      localStorage.removeItem('gameSummary');
      //console.log("Personal preview : ", payload);
      localStorage.setItem('gameSummary', JSON.stringify(payload));
    })

    // Listen for live updates
    socket.on("live_update", (update) => {
      setLiveUpdates((prev) => {
        const newUpdates = [...prev, update];
        // Limit to latest 20 updates to avoid overflow
        return newUpdates.slice(-20);
      });

      /*
      if(update.type === "SESSION" && update.message === "Session Locked!"){
        setCylinderAnimate(false);
        setCylinderVisible(false);
        setDiceLayoutAnimate(true);
        setDiceRollFinished(true);
      }
      */

      if(update.type === "SESSION" && update.message === "Computing Results!!"){
        //setRollTrigger(true);
        setCylinderAnimate(false);
      }

      if(update.type === "SESSION" && update.message === "Results Declared!") {
        // simulate receiving 6 random dice results
        const results = update?.results || [6,6,6,6,6,6];
        // console.log("🎯 Received dice results from backend:", results);
        setDiceResults(results);
        // turn off trigger after animation completes (to allow re-triggering)
        
        /*
        setTimeout(() => {
          setRollTrigger(false);
          setDiceRollFinished(true);
          setCylinderAnimate(false);
          setCylinderVisible(false);
        }, 2500);
        */

        setCylinderAnimate(false);
        setCylinderVisible(false);
        setDiceLayoutAnimate(true);
        setDiceRollFinished(true);
        setPlaceBetPop(false);

        setTimeout(()=>{
          if(isParticipatedRef.current){
            socket.emit("leave_session");
            navigate('/game/summary');
          }
        },3000);
      }
    });

    // Listen for bid confirmations
    socket.on("bid_accepted", ({ chosen_number, amount }) => {
      //console.log(`✅ Bid accepted for ${chosen_number}: Rs.${amount}`);
    });

    socket.on("bid_deleted", ({ chosen_number }) => {
      //console.log(`❌ Bid deleted for number ${chosen_number}`);
    });

    socket.on("bid_rejected", (msg) => 
      //console.warn("Bid rejected:", msg)
      toast.error(msg)
    );
    socket.on("bid_delete_failed", (msg) => 
      //console.warn("Delete failed:", msg)
      toast.error(msg)
    );

    // Cleanup on unmount
    return () => {
      // socket.emit("leave_session");
      // socket.disconnect();
    };
  }, [navigate]);

  // === Debug: log session ===
  //useEffect(()=>{
  //  console.log('Live updates : ', liveUpdates);
  //},[liveUpdates])
  //useEffect(() => {
  //  if (sessionState) console.log("SessionState:", sessionState);
  //}, [sessionState]);

  // === Timer 1: Active phase countdown ===
  useEffect(() => {
    if (activeTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setActiveTimeLeft((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimeLeft]);

  // === Timer 2: Full session countdown ===
  useEffect(() => {
    if (totalTimeLeft <= 0){
      resetForNewSession();
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
      //socketRef.current.disconnect();
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

  // === Bidding Handlers ===
  const handleNumberClick = (e, number) => {
    e.preventDefault();
    if (!isActive) return;
    if (!amount || amount <= 0) return;
    setChosen(number);
    handleBid(number);
    //setAmount(bids[number] || ""); // preload amount if exists
    //setBidModal(true);
  };

  // new method
  const handleMoneyClick = (e, money) => {
    e.preventDefault();
    //console.log(isActive, chosen, money);
    if(!isActive) return;
    setAmount(money);
  }

  const cancelBid = (e) => {
    e.preventDefault();
    setBidModal(false);
    setChosen(null);
    setAmount("");
  };

  /** Calculate total bid amount (all chosen numbers) */
  const getTotalBids = () => {
    return Object.values(bids).reduce((sum, amt) => sum + Number(amt || 0), 0);
  };
  const handleBid = (number) => {
    //e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return;

    const amt = amount;
    const chosen_number = number;

    const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
    //console.log(!amt, isNaN(amt), Number(amt) <= 0)
    if (!amt || isNaN(amt) || Number(amt) <= 0) return;
    
    const payload = {
      userId,
      chosen_number,
      amount: Number(amt),
    };
    //console.log(payload);

    // Emit bid to backend
    socket.emit("place_bid", payload);
    
    setBids((prev) => ({
      ...prev,
      [number]: Number(amt),
    }));
    setBidModal(false);
    setChosen(null);
    setParticipation(true);
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
    if (Object.keys(updated).length === 0) setParticipation(false);
  };

  // === Waiting Screen (no active session) ===
  /*
  if (!isActive && !isParticipated) {
    return (
      <div className="empty-timer">
        <h3>Next game starts in {formatTime(totalTimeLeft)}</h3>
        <h3>Please wait...</h3>
        <div className="controls">
          <button onClick={handleQuit} className="quit-game-btn">Quit Game</button>
          <GameMusicPlayer />
        </div>
      </div>
    );
  }
  */

  // === Main Game UI ===
  return (
    <div className="game-outer number-game">
      {
        /* Game popups */
      }
      {
        placeBetPop && 
        <div className={`game-overlay-pop`}>
          <div className="game-overlay-pop-text" onAnimationEnd={() => setPlaceBetPop(false)}>
            <h2>Place your bet</h2>
          </div>
        </div>
      }

      {/* Quit Transition */}
      {isQuit && (
        <div className="modal">
          <h1 className="quit-text">Quit...</h1>
        </div>
      )}

      {/* Quit Confirmation Modal */}
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

      {/* Bid Modal */}
      {bidModal && (
        <div className="modal bid-modal">
          <div className="quit-modal-container">
            <h3>You selected number {chosen}</h3>
            <h5>Enter Amount</h5>
            <p className="wallet-hint">
              Available Wallet Amount: Rs. {walletBalance - getTotalBids() + (bids[chosen] || 0)}
            </p>
            <div className="input-container">
              <span>Rs.</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const entered = Number(e.target.value);
                  const existingTotal = getTotalBids() - (bids[chosen] || 0);
                  if (entered + existingTotal > walletBalance) {
                    toast.error("Insufficient balance for this bid!");
                    return;
                  }
                  setAmount(entered);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBid(e); // ✅ call same handler
                }}
                autoFocus
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

      {/*Bid Pop Model */}
      {
        showBidPopModal && (
          <div className="modal bid-modal">
            <div className="quit-modal-container">
              <div className="bid-modal-header">
                <h3>Your Bids</h3>
                <IoClose size={22} onClick={() => setShowBidPopModal((prev) => !prev)}/>
              </div>

              <div className="bid-modal-bids-list">
                {Object.entries(bids).map(([num, amt]) => (
                  <div key={num} className="bid-chip">
                    <p className="num">{num !== '7' ? num : 'All'}</p>
                    <p className="amt">Rs. {amt}/-</p>
                    {isActive && (
                      <IoTrash className="icon-trash" onClick={() => handleDeleteBid(num)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Header */}
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

      {/* Game Body */}
      <div className="game-body">
        <div className="game-upper-body">
          {
            /*
            <div className={`live-updates ${expanded && 'expanded'}`}>
              <div
                className="live-updates-header"
                onClick={() => setExpanded((prev) => !prev)}
              >
                <h4>Live Updates</h4>
                <span className="dropdown-icon">
                  {expanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                </span>
              </div>
              <div className="live-updates-box">
                {liveUpdates.length === 0 ? (
                  <p className="empty">No activity yet...</p>
                ) : (
                  liveUpdates
                    .slice()
                    .reverse()
                    .map((update, i) => (
                      <p key={i} className={`update type-${update.type.toLowerCase()}`}>
                        {update.message}
                      </p>
                    ))
                )}
              </div>
            </div>
            */
          }

          <div className="session-timer">
            <h3>
              {isActive
                ? `Bidding ends in ${formatTime(activeTimeLeft)}`
                : `Session Locked!`}
            </h3>
            <p className="wallet-amount-watch">
              Available wallet amount : ₹{walletBalance - getTotalBids() + (bids[chosen] || 0)}
            </p>
          </div>

          {isParticipated && (
            <div className="bid-pop">
              {Object.entries(bids).map(([num, amt]) => (
                <div key={num} className="bid-chip">
                  <p className="num">{num}</p>
                  <p className="amt">Rs. {amt}/-</p>
                  {isActive && (
                    <IoTrash className="icon-trash" onClick={() => handleDeleteBid(num)} />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/*<img src={image1} className="roulette-img"/>*/}

          <div className="dice-layout-wrapper">
            {cylinderVisible && <Cylinder3D animate={cylinderAnimate}/>}
            <div className={`dice-layout ${diceLayoutAnimate && 'animate'}`}>
              {
                diceRollFinished 
                ? <>
                  {(diceResults || [6, 6, 6, 6, 6, 6]).map((val, i) => {
                    const multiplier = sessionState.results?.filter(r => r === val).length || 0;
                    return (
                      <StaticDice key={i} targetNumber={val} bordered={multiplier > 1}/>
                    )
                  })}
                </>
                : <>
                  {diceResults.map((num, i) => (
                    <DiceRoll key={i} targetNumber={num} trigger={false} />
                  ))}
                </>
              }
            </div>
          </div>

        </div>

        <div className="game-lower-body">
          <div className="game-stats-coins-holder">
            <div className="game-stats">
              Total Bid : ₹{Object.values(bids).reduce((sum, amt) => sum + Number(amt), 0)}/-
            </div>

            <div className="coins-icon-holder" onClick={() => setShowBidPopModal((prev) => !prev)}>
              <div><span>{Object.entries(bids).length > 0 ? Object.entries(bids).length : 0}</span></div>
              <RiCoinsFill size={18}/>
            </div>
          </div>

          <div className="game-board-outer">
            <div className="game-board">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className={`game-board-number number${num} 
                    ${
                      bids[num] ? "chosen" : ""
                    } 
                    ${
                      (sessionState?.status === "SETTLED" || sessionState?.status === "RESULTS") && sessionState?.results?.filter(r => r === num).length > 1 && 'winner'
                    }
                  `}
                  onClick={(e) => handleNumberClick(e, num)}
                >
                  <h1>{num}</h1>
                  {bids[num] && <div className="money-card">₹{bids[num]}</div>}
                </div>
              ))}
            </div>
            <div 
              className={`game-board-number game-board-all-suit ${
                bids[7] ? "chosen" : ""
              }`}
              onClick={(e) => handleNumberClick(e, 7)}
            >
              <h1>All Suit</h1>
              {bids[7] && <div className="money-card">₹{bids[7]}</div>}
            </div>
            <div className="money-options">
              {
                [20,50,100,200,500,1000,5000,10000,20000,50000].map((money) => (
                  <div 
                    key={money}
                    className={`
                      money-card ${money <= (walletBalance - getTotalBids() + (bids[chosen] || 0)) ? 'enable' : 'disable'}
                      ${money === amount && 'chosen'}
                    `}
                    onClick={(e) => handleMoneyClick(e,money)}
                  >
                    ₹{money}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberGame;