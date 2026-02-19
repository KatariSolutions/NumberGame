import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StaticDice from './StaticDice';
import { getBidsbySessionAPI } from '../../apis/bids/getBidsBySessionAPI';
import { toast } from 'react-toastify';

function GameSummary({ summary: summaryProp }) {
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [summary, setSummary] = useState(summaryProp || null);
  const [userBids, setUserBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countdown, setCountdown] = useState(5);
  const countdownIntervalRef = useRef(null);

  // Load user credentials
  useEffect(() => {
    const tok = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!tok) {
      toast.error("Please login again.");
      window.location.href = "/auth/login";
      return;
    }
    setToken(tok);
  }, [navigate]);

  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // cleanup on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      clearInterval(countdownIntervalRef.current);
      navigate('/game/numbergame');
    }
  }, [countdown, navigate]);

  // === Load summary from localStorage if not passed as prop ===
  useEffect(() => {
    if (!summaryProp) {
      const storedSummary = localStorage.getItem('gameSummary');
      if (storedSummary) {
        setSummary(JSON.parse(storedSummary));
      } else {
        // if even localStorage empty → redirect (prevent crash)
        navigate('/app');
      }
    }
  }, [summaryProp, navigate]);

  // === Fetch user's bids and session results ===
  const fetchBids = async (sessionId, userId) => {
    try {
      const res = await getBidsbySessionAPI(sessionId, userId, token);
      //console.log(res);
      if (res.status === 201) {
        setUserBids(res.result);
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        toast.error(res.message || 'Failed to fetch bids')
      }
    } catch (err) {
      toast.error('Failed to fetch bid details.');
      if (err?.status === 403) navigate('/403');
      if (err?.status === 401) navigate('/401');
      if(err?.status === 500) {
        navigate('/500')
      }
    } finally {
      setLoading(false);
    }
  };

  // === Fetch bids once summary is available ===
  useEffect(() => {
    //console.log(summary);
    if (summary?.dbSessionId && summary?.userId) {
      fetchBids(summary.dbSessionId, summary.userId);
    }
  }, [summary]);

  const handleNavigation = (path) => {
    // 🛑 stop auto redirect
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    localStorage.removeItem('gameSummary'); // cleanup
    navigate(path);
  };

  if (!summary) return <p>Loading summary...</p>;

  const { dbSessionId, results, totalBid, totalPayout, userId, net } = summary;

  return (
    <div className="game-summary-container">
      <div className="summary-card">
        <h1>Game Results</h1>

        <div className="dice-layout">
          {(results || [6, 6, 6, 6, 6, 6]).map((val, i) => {
            const multiplier = summary.results?.filter(r => r === val).length || 0;
            return (
              <StaticDice key={i} targetNumber={val} bordered={multiplier > 1}/>
            )
          })}
        </div>

        <div className={`summary-message ${net > 0 ? 'positive' : 'negative'}`}>
          {net > 0 ? '🎉 Congratulations! You Won' : '😔 Better Luck Next Time'}
        </div>

        <div className="summary-details">
          <p><strong>Total Bids:</strong> ₹{totalBid}</p>
          <p><strong>Total Payout:</strong> ₹{totalPayout}</p>
          <p className={net > 0 ? 'profit' : 'loss'}>
            <strong>Net Result:</strong> {net > 0 ? `+₹${net}` : `₹${net}`}
            ({net > 0 ? 'credited to your wallet' :'deducted from your wallet'})
          </p>
          {loading ? (
            <p>...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <>
              {userBids.length > 0 && (
                <div className="bids-list">
                  <table className="bids-table">
                    <thead>
                      <tr>
                        <th>Chosen</th>
                        <th>Amount (₹)</th>
                        <th>Multiplier</th>
                        <th>Profit/Loss (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBids.map((b, idx) => {
                        const summarySet = new Set(summary.results);
                        const multiplier = b.chosen_number !== 7 
                                            ? summary.results?.filter(r => r === b.chosen_number).length || 0 
                                            : summarySet.size === 6 ? 6 : 0;
                        const total = multiplier * b.amount;
                        return (
                          <tr key={idx} className={multiplier > 1 ? 'win-row' : 'loss-row'}>
                            <td>{b.chosen_number !== 7 ? b.chosen_number : 'All Suit'}</td>
                            <td>{b.amount}</td>
                            <td>{multiplier}x</td>
                            <td>{multiplier > 1 ? `+₹${total}` : `-₹${b.amount}`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="summary-buttons">
          <button className="btn secondary" onClick={() => handleNavigation('/app')}>
            Go Home
          </button>
          <button className="btn primary" onClick={() => handleNavigation('/game/numbergame')}>
            Join Next Game ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameSummary;
