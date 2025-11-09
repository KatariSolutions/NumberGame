import React, { useEffect, useState } from 'react';
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

  // Load user credentials
  useEffect(() => {
    const tok = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!tok) {
      toast.error("Please login again.");
      window.location.href = "/auth/login";
      return;
    }
    setToken(tok);
  }, []);

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
      console.log(res);
      if (res.status === 201) {
        setUserBids(res.result);
      } else {
        setError('Failed to fetch bids');
      }
    } catch (err) {
      toast.error('Failed to fetch bid details.');
      if (err?.status === 403) navigate('/403');
      if (err?.status === 401) navigate('/401');
    } finally {
      setLoading(false);
    }
  };

  // === Fetch bids once summary is available ===
  useEffect(() => {
    if (summary?.dbSessionId && summary?.userId) {
      fetchBids(summary.dbSessionId, summary.userId);
    }
  }, [summary]);

  const handleNavigation = (path) => {
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
          {(results || [6, 6, 6, 6, 6, 6]).map((val, i) => (
            <StaticDice key={i} targetNumber={val} trigger={false} />
          ))}
        </div>

        <div className={`summary-message ${net > 0 ? 'positive' : 'negative'}`}>
          {net > 0 ? '🎉 Congratulations! You Won' : '😔 Better Luck Next Time'}
        </div>

        <div className="summary-details">
          {loading ? (
            <p>Loading bid details...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <>
              <p><strong>Total Bids:</strong> ₹{totalBid} (deducted from your wallet)</p>
              <p><strong>Total Payout:</strong> ₹{totalPayout}</p>
              <p className={net > 0 ? 'profit' : 'loss'}>
                <strong>Net Result:</strong> {net > 0 ? `+₹${net}` : `₹${net}`}
              </p>

              {userBids.length > 0 && (
                <div className="bids-list">
                  <table className="bids-table">
                    <thead>
                      <tr>
                        <th>Chosen Number</th>
                        <th>Amount (₹)</th>
                        <th>Multiplier</th>
                        <th>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBids.map((b, idx) => {
                        const multiplier = summary.results?.filter(r => r === b.chosen_number).length || 0;
                        const total = multiplier * b.amount;
                        return (
                          <tr key={idx} className={multiplier > 0 ? 'win-row' : 'loss-row'}>
                            <td>{b.chosen_number}</td>
                            <td>{b.amount}</td>
                            <td>{multiplier}x</td>
                            <td>{multiplier > 0 ? `+₹${total}` : `-₹${b.amount}`}</td>
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
            Join Next Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameSummary;
