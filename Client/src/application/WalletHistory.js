import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { getWalletRequestsAPI } from '../apis/walletRequests/getWalletRequestsAPI';
import { toast } from 'react-toastify';
import { IoMdArrowRoundBack } from 'react-icons/io';

function WalletHistory() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState("");
    const [token, setToken] = useState("");

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // Load user credentials
    useEffect(() => {
        const uid = sessionStorage.getItem("userId") || localStorage.getItem("userId");
        const tok = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!uid || !tok) {
          toast.error("Please login again.");
          window.location.href = "/auth/login";
          return;
        }
        setUserId(uid);
        setToken(tok);
    }, []);

    const fetchWalletRequests = async () => {
        try {
          setLoading(true)
          const res = await getWalletRequestsAPI(userId, token);
          if (res.status === 201) {
            setHistory(res.result);
          } else if (res.status === 403) {
            toast.error(res.message);
            navigate('/403');
          } else if (res.status === 401) {
            toast.error(res.message);
            navigate('/401');
          } else {
            toast.error(res.message)
          }
        } catch (err) {
            toast.error("Failed to fetch wallet requests.");
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
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && token) {
          fetchWalletRequests();
        }
    }, [userId, navigate]);

    return (
        <div className='wallet-container'>
            <div className='header-history'>
                <h2>Wallet Requests</h2>
                <button onClick={() => navigate(-1)}>Go Back</button>    
            </div>

            <div className="transactions-table">
                {loading 
                    ? (<div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading transactions...</p>
                    </div>)
                    : (
                        <table>
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Payment Proof</th>
                                <th>Status</th>
                                <th>Admin Note</th>
                                <th>Reference</th>
                              </tr>
                            </thead>
                            <tbody>
                                {
                                    history.map((hist) => (
                                        <tr key={hist.request_id}>
                                            <td>{hist.request_type}</td>
                                            <td>{new Date(hist.created_at).toLocaleDateString()}</td>
                                            <td className={hist.amount > 0 ? "credit" : "debit"}>
                                              {hist.amount > 0 ? "+" : ""}
                                              ₹{hist.amount.toFixed(2)}
                                            </td>
                                            <td>{hist.pay_img && <a href={hist.pay_img} target='_blank'>View Image</a>}</td>
                                            <td className={`${
                                                    hist.status === "APPROVED"
                                                    ? "status-green"
                                                    : hist.status === "REJECTED"
                                                        ? "status-red"
                                                        : "status-orange"
                                                }`}
                                            >{hist.status}</td>
                                            <td>{hist.admin_note}</td>
                                            <td>{hist.payment_ref}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    )
                }
            </div>
        </div>
    )
}

export default WalletHistory