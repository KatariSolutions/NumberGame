import React, { useEffect, useState } from "react";
import { IoPencil, IoWallet, IoTimeOutline, IoAdd, IoRefresh } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getProfileDetailsAPI } from "../apis/user/getProfileDetailsAPI";
import { updateProfileDetailsAPI } from "../apis/user/updateProfileDetailsAPI";
import { getWalletBalanceAPI } from "../apis/wallet/getWalletBalanceAPI";
import { getWalletTransactionsAPI } from "../apis/wallet/getWalletTransactionsAPI";
import { getBidsbyUserIdAPI } from "../apis/bids/getBidsByUserIdAPI";
//import defaultAvatar from "../gallery/default-avatar.png";

function Profile() {
  const navigate = useNavigate();

  const [user_id,setUserId] = useState(0);
  const [token, setToken] = useState('');

  const [profile, setProfile] = useState({
    avatar_url: "",
    full_name: "",
    email: "",
    dob: "",
    address: "",
    pincode: "",
  });

  const [walletBalance, setWalletBalance] = useState(0)

  const [wallet, setWallet] = useState({
    balance: 0,
    transactions: [],
  });

  const [bids, setBids] = useState([]);

  const [isEditing, setIsEditing] = useState(false);

  // Get user_id and token from localstorage/sessionstorage
  useEffect(() => {
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
  }, []);

  // fetch user details from endpoint
  const fetchProfileData = async () => {
    try{
      const res = await getProfileDetailsAPI(user_id,token);
      //console.log(res)
      if(res.status==201){
        const userData = res.result;

        // ✅ Convert DOB if it exists
        if (userData.dob) {
          const date = new Date(userData.dob);
          userData.dob = date.toISOString().split("T")[0]; // format -> YYYY-MM-DD
        }

        setProfile(userData);
      }
    } catch (err) {
      console.error(err);
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  };

  // fetch wallet balance from endpoint
  const fetchWalletBalance = async () => {
    try{
      const res = await getWalletBalanceAPI(user_id, token);
      //console.log(res)
      if(res.status==201){
        const WB = res.result?.balance || 0;
        setWalletBalance(WB);
      } else {
        toast.error("Failed to fetch wallet balance. Try again later!")
      }
    } catch (err) {
      console.log(err);
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  }
  useEffect(() => {
    if (!user_id || !token) return; // wait until both are available
    // Initial fetch
    fetchWalletBalance();
    // Set up interval for every 60 seconds
    const interval = setInterval(() => {
      fetchWalletBalance();
    }, 60000); // 60,000 ms = 1 minute
    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, [user_id, token]);

  const fetchWalletData = async () => {
    try {
      const res = await getWalletTransactionsAPI(user_id, token);
      console.log(res)
      if(res.status==201){
        const wallet = res.result || {};
        setWallet(wallet);
      } else {
        toast.error("Failed to fetch wallet transactions. Try again later!")
      }
    } catch (err) {
      console.log(err);
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  };

    // fetch user details from endpoint
  const fetchBidsData = async () => {
    try{
      const res = await getBidsbyUserIdAPI(user_id,token);
      //console.log(res)
      if(res.status==201){
        const bidsData = res.result;
        setBids(bidsData);
      }
    } catch (err) {
      console.error(err);
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  };

  useEffect(()=>{
    //console.log('user_id : ',user_id);
    //console.log('token : ', token);

    if (user_id !== 0) {
      fetchProfileData();
      fetchWalletData();
      fetchBidsData();
    }
  },[user_id,token])

  /*
  useEffect(()=>{
    console.log('profile : ',profile);
  },[profile])
  */

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // to save the profile details
  const handleSave = async () => {
    try {
      setIsEditing(false);

      const payload = {
        user_id,
        name: profile.full_name,
        dob: profile.dob,
        avatar: profile.avatar_url,
        address: profile.address,
        pincode: profile.pincode,
      };

      const res = await updateProfileDetailsAPI(payload, token);
      //console.log('res : ', res);
      if (res.status == 201) {
        toast.success(res.message);
        fetchProfileData(); // Refresh profile details after update
      } else {
        toast.warn("Something went wrong! Try again later.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.error || "Failed to update profile. Please try again.");
      if(err?.status === 403) {
        navigate('/403');
      }
      if(err?.status === 401) {
        navigate('/401');
      }
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-title-cards">
        <h2 className="profile-title">My Profile</h2>
        <div className="">
          <h4><IoWallet /> Wallet Balance</h4>
          <p className="wallet-balance">₹ {walletBalance.toFixed(2)} {/*<IoRefresh />*/}</p>
        </div>
      </div>

      <div className="profile-section">
        <div>
          <div className="profile-avatar">
            <div className="img-holder">
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  width={120}
                  height={120}
                  className="avatar-img"
                />
            </div>
            <button className="add-btn">
              <IoAdd />
            </button>
          </div>
          <button className={`edit-btn-new ${isEditing && 'enabled'}`} onClick={handleEditToggle}>Edit Profile</button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={profile?.full_name}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile?.email}
              disabled
            />
          </div>

          <div className="detail-item">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={profile?.dob}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={profile?.address}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={profile?.pincode}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* 💰 Wallet Info */}
      <div className="wallet-section">
        <h3><IoWallet /> Recent Transactions</h3>
        {wallet.length > 0 ? (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {wallet.map((txn) => (
                <tr key={txn.txn_id}>
                  <td>{txn.amount > 0 ? 'CREDIT' :'DEBIT'}</td>
                  <td>₹{txn.amount}</td>
                  <td>{txn?.created_at.replace('T'," ").replace('Z', " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No transactions yet</p>
        )}

        <button className="view-more" onClick={() => navigate("/app/wallet")}>
          View More
        </button>
      </div>

      {/* 🎯 Bids Section */}
      <div className="bids-section">
        <h3><IoTimeOutline /> Recent Bids</h3>
        {bids.length > 0 ? (
          <table className="bids-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Bid</th>
                <th>Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {bids.slice(0, 5).map((bid) => (
                <tr key={bid.session_id}>
                  <td>{bid.session_id}</td>
                  <td>₹{bid.bid_placed}</td>
                  <td>{bid.PnL > 0 ? '+'+bid.PnL : bid.PnL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-bids">
            <p>No bids yet. Start playing now!</p>
            <button onClick={() => navigate("/app/dashboard")}>Play Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;