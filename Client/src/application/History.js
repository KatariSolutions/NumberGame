import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { getBidsbyUserIdAPI } from '../apis/bids/getBidsByUserIdAPI';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { getBidsbySessionAPI } from '../apis/bids/getBidsBySessionAPI';
import { toast } from 'react-toastify';

function History() {
    const navigate = useNavigate();

    const [user_id,setUserId] = useState(0);
    const [token, setToken] = useState('');

    const [bidHistory, setBidHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [bidDetails, setBidDetails] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [session, setSession] = useState(0);
    const [loading, setLoading] = useState(false);

    // setting the token & user_id
    useEffect(()=>{
        let userId = sessionStorage.getItem('userId');
        // If not found in session, check localStorage
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
    
        if (!userId) {
          navigate('../login');
          return;
        }

        setUserId(userId);

        let tok = sessionStorage.getItem('token');
        // If not found in session, check localStorage
        if (!tok) {
          tok = localStorage.getItem('token');
        }
    
        if (!tok) {
          navigate('../login');
          return;
        }

        setToken(tok);
    },[]);

    // fetch bids history from endpoint
    const fetchBidsData = async () => {
      try{
        setHistoryLoading(true);
        const res = await getBidsbyUserIdAPI(user_id,token);
        //console.log(res)
        if(res.status==201){
          const bidsData = res.result;
          setBidHistory(bidsData);
        } else if (res.status === 403) {
          toast.error(res.message);
          navigate('/403');
        } else if (res.status === 401) {
          toast.error(res.message);
          navigate('/401');
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        console.error(err);
        if(err?.status === 403) {
          navigate('/403');
        }
        if(err?.status === 401) {
          navigate('/401');
        }
        if(err?.status === 500) {
          navigate('/500')
        }
      } finally {
        setHistoryLoading(false);
      }
    };

    // fetch user details from endpoint
    const fetchBidsDetails = async () => {
      try{
        setLoading(true);
        const res = await getBidsbySessionAPI(session,user_id,token);
        //console.log(res)
        if(res.status==201){
          const sessionData = res.result;
          setBidDetails(sessionData);
          setLoading(false);
        } else if (res.status === 403) {
          toast.error(res.message);
          navigate('/403');
        } else if (res.status === 401) {
          toast.error(res.message);
          navigate('/401');
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        console.error(err);
        if(err?.status === 403) {
          navigate('/403');
        }
        if(err?.status === 401) {
          navigate('/401');
        }
        if(err?.status === 500) {
          navigate('/500')
        }
      }
    };

    useEffect(()=>{
      if (user_id !== 0) {
        fetchBidsData();
      }
    },[user_id, token]);

    useEffect(()=>{
      if(user_id !== 0 && session !== 0) {
        fetchBidsDetails();
      }
    },[session]);

    const toggleExpand = async (sessionId) => {
      if (expanded === sessionId) {
        setExpanded(null);
        return;
      }

      setExpanded(sessionId);
      setSession(sessionId);
    };

    return (
      <div className="game-history-container">
        <h1 className="history-title">Game History</h1>

        {
          historyLoading
          ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          )
          : <>
          {bidHistory.length === 0 ? (
            <p className="no-history">No games played yet.</p>
          ) : (
            bidHistory.map((item) => (
              <div key={item.session_id} className="history-card">
                {/* Summary section */}
                <div
                  className="history-summary"
                  onClick={() => toggleExpand(item.session_id)}
                >
                  <div className="summary-left">
                    <p className="session-id">Game #{item.session_id}</p>
                    <p className="session-date">
                      {new Date(item.results_declared_date).toLocaleString()}
                    </p>
                  </div>
  
                  <div
                    className={`summary-net ${
                      item.PnL >= 0 ? "profit" : "loss"
                    }`}
                  >
                    ₹
                    {item.PnL >= 0 ? "+" : ""}
                    {item.PnL.toFixed(2)}
                  </div>
  
                  <div className="summary-icon">
                    {expanded === item.session_id ? (
                      <IoChevronUp size={20} />
                    ) : (
                      <IoChevronDown size={20} />
                    )}
                  </div>
                </div>
  
                {expanded === item.session_id 
                ? loading 
                  ? <p>Loading...</p>
                  : (
                  <div className="history-details">
                    <p className="result-line">
                      <strong>Game Result:</strong>{" "}
                      {item.winning_number}
                    </p>
  
                    <table className="details-table">
                      <thead>
                        <tr>
                          <th>Chosen</th>
                          <th>Amount</th>
                          <th>Multiplier</th>
                          <th>Status</th>
                          <th>Winnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidDetails.map((d, i) => {
                          const winning = String(item.winning_number);
                          const chosen = String(d.chosen_number);
                          const multiplier = winning.split("").filter(r => r === chosen).length || 0;
                          return (<tr key={i}>
                            <td>{d.chosen_number}</td>
                            <td>₹{d.amount}</td>
                            <td>x{multiplier}</td>
                            <td
                              className={
                                d.is_winner ? "status-win" : "status-lose"
                              }
                            >
                              {d.is_winner ? "Win" : "Lost"}
                            </td>
                            <td>₹{d.payout}</td>
                          </tr>)
                        })}
                      </tbody>
                    </table>
                  </div>)
                : <></>  
                }
              </div>
            ))
          )}
          </>
        }
      </div>
    )
}

export default History