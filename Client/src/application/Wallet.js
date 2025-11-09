import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IoAdd, IoArrowDown, IoArrowUp, IoFilter } from "react-icons/io5";
import { getWalletBalanceAPI } from "../apis/wallet/getWalletBalanceAPI";
import { getWalletTransactionsAPI } from "../apis/wallet/getWalletTransactionsAPI";
import { withdrawWalletAPI } from "../apis/wallet/withdrawWalletAPI";
import { addFundsWalletAPI } from "../apis/wallet/addFundsWalletAPI";
import { useNavigate } from "react-router-dom";

function Wallet() {
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

  const navigate = useNavigate();

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
      }
    } catch (err) {
      toast.error("Failed to fetch wallet balance.");
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
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
      } else {
        setTransactions([]);
      }
    } catch (err) {
      toast.error("Failed to fetch transactions.");
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userId && token) {
      fetchWalletBalance();
      fetchTransactions();
    }
  }, [userId, token]);

  // Auto refresh every minute
  useEffect(() => {
    const interval = setInterval(() => fetchWalletBalance(), 60000);
    return () => clearInterval(interval);
  }, [userId, token]);

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
      const res = await withdrawWalletAPI(userId, token, amount, 'XYZ12345', 'SELF');
      //console.log(res)
      if (res.status === 201) {
        toast.success("Withdrawal successful! will be credited to your Bank Account soon.");
        setShowWithdrawModal(false);
        fetchWalletBalance();
        fetchTransactions();
        setAmount('');
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
    }
  };

  // Add Funds Handler
  const handleAddFunds = async () => {
    if (!amount || amount <= 0 || amount > 50000) return toast.warn("Enter valid amount!");
    try {
      const res = await addFundsWalletAPI(userId, token, amount, 'ABC12345', 'SELF');
      //console.log(res);
      if (res.status === 201) {
        toast.success("Funds added successfully!");
        setShowAddModal(false);
        fetchWalletBalance();
        fetchTransactions();
        setAmount('');
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
        <div className="wallet-actions">
          <button className="withdraw-btn" onClick={() => setShowWithdrawModal(true)}>
            <IoArrowDown /> Withdraw
          </button>
          <button className="add-funds-btn" onClick={() => setShowAddModal(true)}>
            <IoAdd /> Add Funds
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
      {showWithdrawModal && (
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
              <button onClick={handleWithdraw} disabled={amountError}>Withdraw</button>
              <button onClick={() => removeModels()}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Funds</h3>
            {amountError && <p className="msg-amt-err">Amount must be between 100 and 50,000.</p>}
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleAddFunds} disabled={amountError}>Add Funds</button>
              <button onClick={() => removeModels()}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;