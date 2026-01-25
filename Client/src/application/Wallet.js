import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { IoAdd, IoArrowDown, IoArrowUp, IoFilter,IoCameraOutline, IoClose } from "react-icons/io5";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { getWalletBalanceAPI } from "../apis/wallet/getWalletBalanceAPI";
import { getWalletTransactionsAPI } from "../apis/wallet/getWalletTransactionsAPI";
import { withdrawWalletRequestAPI } from "../apis/walletRequests/withdrawWalletRequestAPI";
import { rechargeWalletRequestAPI } from "../apis/walletRequests/rechargeWalletRequestAPI";
import { getActiveWalletRequestsAPI } from "../apis/walletRequests/getActiveWalletRequestsAPI";
import { useNavigate } from "react-router-dom";
import { getBankDetailsAPI } from "../apis/bank/getBankDetailsAPI";

function Wallet() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError]= useState(false);
  const [filters, setFilters] = useState({ txn_type: "ALL", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);

  const [pendings, setPendings] = useState({});
  const [hasBankDetails, setHasBankDetails]= useState(true);

  const fileInputRef = useRef(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [imageError, setImageError] = useState("");

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

  // Fetch Wallet Balance
  const fetchWalletBalance = async () => {
    try {
      const res = await getWalletBalanceAPI(userId, token);
      if (res.status === 201) {
        setBalance(res.result?.balance || 0);
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
      toast.error("Failed to fetch wallet balance.");
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

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getWalletTransactionsAPI(userId, token, filters.txn_type, filters.start_date, filters.end_date);
      if (res.status === 201) {
        setTransactions(res.result || []);
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        setTransactions([]);
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to fetch transactions.");
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

    // Fetch Transactions
  const fetchActiveWalletRequests = async () => {
    try {
      const res = await getActiveWalletRequestsAPI(userId, token);
      if (res.status === 201) {
        setPendings(res.result[0] || {});
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        setPendings({});
        toast.error(res.message);
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
    }
  };

  // fetch bank details
  const fetchBankDetails = async () => {
    try{
      const res = await getBankDetailsAPI(token, userId);
      if (res.status === 209) {
        setHasBankDetails(false)
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
      toast.error("Failed to fetch bank details.");
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
  }

  // Initial load
  useEffect(() => {
    if (userId && token) {
      fetchWalletBalance();
      fetchActiveWalletRequests();
      fetchTransactions();
      fetchBankDetails();
    }
  }, [userId, token]);

  {/*
  // Auto refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWalletBalance();
      fetchActiveWalletRequests();
      fetchTransactions();
     }, 60000);
    return () => clearInterval(interval);
  }, [userId, token]);
  */}

  // amount watcher
  useEffect(() => {
    //console.log(amount);
    if(parseInt(amount) < 100 || parseInt(amount) > 50000){
      setAmountError(true);
    } else {
      setAmountError(false);
    }
  },[amount])

  // Withdraw Handler
  const handleWithdraw = async () => {
    if (!amount || amount <= 0 || amount > 50000) return toast.warn("Enter valid amount!");
    if (amount > balance) return toast.error("Insufficient balance!");
    try {
      const res = await withdrawWalletRequestAPI(userId, token, amount);
      //console.log(res)
      if (res.status === 201) {
        toast.success(res.message);
        setShowWithdrawModal(false);
        fetchActiveWalletRequests();
        setAmount('');
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        toast.error(res.message || "Withdraw failed!");
      }
    } catch (err) {
      toast.error("Withdraw failed!");
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

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are allowed");
      e.target.value = null;
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image size must be less than 5MB");
      e.target.value = null;
      return;
    }

    setImageError("");
    setPaymentImage(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveImage = () => {
    setPaymentImage(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // important
    }
  };

  // Add Funds Handler
  const handleAddFunds = async () => {
    if (!paymentImage) {
      setImageError("Payment screenshot is mandatory");
      return;
    }

    if (!amount || amount <= 0 || amount > 50000) return toast.warn("Enter valid amount!");

    const request_type='DEPOSIT'

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("user_id", userId);
    formData.append("request_type", request_type);
    formData.append("image", paymentImage);
    
    try {
      const res = await rechargeWalletRequestAPI(formData, token);
      console.log(res);
      if (res.status === 201) {
        toast.success("Request sent! will reflect in your wallet shortly.");
        setShowAddModal(false);
        fetchActiveWalletRequests();
        setAmount('');
        handleRemoveImage();
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        toast.error(res.message || "Add funds failed!");
      }
    } catch (err) {
      toast.error("Add funds failed!");
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

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchTransactions();
  };

  const removeModels = () => {
    setShowAddModal(false);
    setShowWithdrawModal(false);
    setAmount('');
  }
  
  return (
    <div className="wallet-container">
      {/*<h2>My Wallet</h2>*/}

      {/* Wallet Balance */}
      <div className="wallet-balance-card">
        <h3>Wallet Balance</h3>
        <p className="balance">₹ {balance.toFixed(2)}</p>
        {
          pendings && Object.keys(pendings).length > 0 && <p className="pending-status-box">
            <IoIosInformationCircleOutline size={16}/>
            {
              pendings?.request_type === 'DEPOSIT'
              ? `A deposit of ₹${pendings?.amount} is still pending.`
              : `A withdraw request of ₹${pendings?.amount} is pending.`
            }
          </p>
        }
        {
          !hasBankDetails && <p className="pending-status-box">
            <IoIosInformationCircleOutline size={16}/>
            Please update your bank details.
          </p>
        }
        <div className="wallet-actions">
          <button className="withdraw-btn" onClick={() => {
            if(!hasBankDetails){
              toast.error('Please update your bank details.')
            } else {
              setShowWithdrawModal(true);
            }
          }}>
            <IoArrowDown /> Withdraw
          </button>
          <button className="add-funds-btn" 
            onClick={() => setShowAddModal(true)}
            disabled={(pendings && Object.keys(pendings).length > 0)}
          >
            <IoAdd /> Add Funds
          </button>
          <button className="view-history-btn"
            onClick={() => navigate('/app/wallet/history')}
          >
            View History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          name="txn_type"
          value={filters.txn_type}
          onChange={handleFilterChange}
        >
          <option value="ALL">All</option>
          <option value="SELF">Self</option>
          <option value="SYSTEM">System</option>
        </select>

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
        />
        <button onClick={applyFilters}>
          <IoFilter /> Apply
        </button>
      </div>

      {/* Transactions */}
      <div className="transactions-table">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <table>
            <thead>
              <tr>
                {/*<th>ID</th>*/}
                <th>Reference</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.txn_id}>
                  {/*<td>{txn.txn_id}</td>*/}
                  <td>{txn.reference_id}</td>
                  <td className={txn.amount > 0 ? "credit" : "debit"}>
                    {txn.amount > 0 ? "+" : ""}
                    ₹{txn.amount.toFixed(2)}
                  </td>
                  <td>{txn.txn_type}</td>
                  <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center" }}>No transactions found.</p>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && hasBankDetails && (
        <div className="modal">
          <div className="modal-content">
            <h3>Withdraw Funds</h3>
            {amountError && <p className="msg-amt-err">Amount must be between 100 and 50,000.</p>}
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => removeModels()}>Cancel</button>
              <button onClick={handleWithdraw} disabled={amountError}>Withdraw</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Funds</h3>

            <div className="payment-steps">
              <div className="step step-1">
                <div><span>1</span></div>
                <p>Send money through any <b>UPI</b> App for the mobile number : <b>+91 xxxx xxxxx</b></p>
              </div>
              <div className="step step-2">
                <div><span>2</span></div>
                <p>Take screenshot of the payment done. And <b>upload</b> below.</p>
              </div>
              <div className="step step-3">
                <div><span>3</span></div>
                <p>Enter the same amount you paid in the below box and click <b>Add Funds</b> button.</p>
              </div>
            </div>

            {/* Upload Screenshot */}
            <div className="upload-proof">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                style={{ display: "none" }}
              />

              {!paymentImage ? (
                <div className="upload-box" onClick={handleCameraClick}>
                  <IoCameraOutline size={16} />
                  <p>Upload payment screenshot</p>
                </div>
              ) : (
                <div className="uploaded-preview">
                  <span className="file-name">📷 {paymentImage.name}</span>
                  <IoClose
                    className="remove-icon"
                    onClick={handleRemoveImage}
                  />
                </div>
              )}

              {imageError && (
                <p className="msg-img-err">{imageError}</p>
              )}
            </div>

            {amountError && <p className="msg-amt-err">Amount must be between 100 and 50,000.</p>}
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => removeModels()}>Cancel</button>
              <button onClick={handleAddFunds} disabled={amountError || !paymentImage}>Add Funds</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;