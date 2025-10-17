import React, { useEffect, useState } from "react";
import { IoPencil, IoWallet, IoTimeOutline, IoAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getProfileDetailsAPI } from "../apis/user/getProfileDetailsAPI";
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

  const [wallet, setWallet] = useState({
    balance: 0,
    transactions: [],
  });

  const [bids, setBids] = useState([]);

  const [isEditing, setIsEditing] = useState(false);

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

  const fetchProfileData = async () => {
    try{
      const res = await getProfileDetailsAPI(user_id,token);
      console.log(res)
      if(res.status==201){
        setProfile(res.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(()=>{
    //console.log('user_id : ',user_id);
    //console.log('token : ', token);

    fetchProfileData();
    fetchWalletData();
    fetchBidsData();
  },[user_id,token])

  /*
  useEffect(()=>{
    console.log('profile : ',profile);
  },[profile])
  */

  const fetchWalletData = async () => {
    const res = {
      balance: 1520.5,
      transactions: [
        { id: 1, type: "Credit", amount: 500, date: "2025-10-10" },
        { id: 2, type: "Debit", amount: 200, date: "2025-10-09" },
        { id: 3, type: "Credit", amount: 1000, date: "2025-10-07" },
      ],
    };
    setWallet(res);
  };

  const fetchBidsData = async () => {
    const res = [
      { id: 1, number: 23, amount: 100, date: "2025-10-09" },
      { id: 2, number: 45, amount: 150, date: "2025-10-07" },
      { id: 3, number: 12, amount: 200, date: "2025-10-05" },
    ];
    setBids(res);
  };

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log("Profile updated:", profile);
  };

  return (
    <div className="profile-container">
      <div className="profile-title-cards">
        <h2 className="profile-title">My Profile</h2>
        <div className="">
          <h4><IoWallet /> Wallet Balance</h4>
          <p className="wallet-balance">₹ {wallet.balance.toFixed(2)}</p>
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
              value={profile.full_name}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled
            />
          </div>

          <div className="detail-item">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="detail-item">
            <label>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={profile.pincode}
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
        {wallet.transactions.length > 0 ? (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.type}</td>
                  <td>₹{txn.amount}</td>
                  <td>{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No transactions yet</p>
        )}

        <button className="view-more" onClick={() => navigate("/wallet")}>
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
                <th>Number</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {bids.slice(0, 5).map((bid) => (
                <tr key={bid.id}>
                  <td>{bid.number}</td>
                  <td>₹{bid.amount}</td>
                  <td>{bid.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-bids">
            <p>No bids yet. Start playing now!</p>
            <button onClick={() => navigate("/app/play")}>Play Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;