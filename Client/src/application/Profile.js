import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoWallet, IoTimeOutline, IoAdd } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { toast } from "react-toastify";

import { getProfileDetailsAPI } from "../apis/user/getProfileDetailsAPI";
import { updateProfileDetailsAPI } from "../apis/user/updateProfileDetailsAPI";
import { getWalletBalanceAPI } from "../apis/wallet/getWalletBalanceAPI";
import { getWalletTransactionsAPI } from "../apis/wallet/getWalletTransactionsAPI";
import { getBidsbyUserIdAPI } from "../apis/bids/getBidsByUserIdAPI";
import { uploadProfile } from "../apis/upload/uploadProfile";

import BankDetails from "../components/BankDetails";
//import defaultAvatar from "../gallery/default-avatar.png";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const [imgError, setImgError] = useState("");
  const [imageLoad, setImageLoad] = useState(false);

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
      //console.error(err);
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

  // fetch wallet balance from endpoint
  const fetchWalletBalance = async () => {
    try{
      const res = await getWalletBalanceAPI(user_id, token);
      //console.log(res)
      if(res.status==201){
        const WB = res.result?.balance || 0;
        setWalletBalance(WB);
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
      //console.log(err);
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
  
  useEffect(() => {
    if (!user_id || !token) return; // wait until both are available
    // Initial fetch
    fetchWalletBalance();
    /*
    // Set up interval for every 60 seconds
    const interval = setInterval(() => {
      fetchWalletBalance();
    }, 60000); // 60,000 ms = 1 minute
    // Cleanup on component unmount
    return () => clearInterval(interval);
    */
  }, [user_id, token]);

  const fetchWalletData = async () => {
    try {
      const res = await getWalletTransactionsAPI(user_id, token);
      //console.log(res)
      if(res.status==201){
        const wallet = res.result || {};
        setWallet(wallet);
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
      //console.log(err);
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

    // fetch user details from endpoint
  const fetchBidsData = async () => {
    try{
      const res = await getBidsbyUserIdAPI(user_id,token);
      //console.log(res)
      if(res.status==201){
        const bidsData = res.result;
        setBids(bidsData);
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
      //console.error(err);
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

  const uploadImage = async (file) => {
    try{
        if (!file) return;

        setImageLoad(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("user_id", user_id);
    
        const res = await uploadProfile(formData, token);
        // console.log(res);
        if (res.status === 201) {
          toast.success(res.message);
          fetchProfileData();
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
      setImageLoad(false);
    }
  };

  const handleIconClick = () => {
    if (!imageLoad) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setImgError("File size must be less than 2MB");
      e.target.value = null; // reset input
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setImgError("Only image files are allowed");
      e.target.value = null;
      return;
    }

    uploadImage(selectedFile);
  };

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
      //console.error("Error updating profile:", err);
      toast.error(err.error || "Failed to update profile. Please try again.");
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
              {
                profile?.avatar_url
                ? <img
                  src={profile?.avatar_url}
                  alt="Avatar"
                  width={120}
                  height={120}
                  className="avatar-img"
                />
                : <h1>{profile?.full_name && profile?.full_name[0].toLocaleUpperCase()}</h1>
              }
            </div>
            <button className="add-btn" disabled={imageLoad}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {imageLoad ? (
                <AiOutlineLoading3Quarters
                  className="img-spinner"
                />
              ) : (
                <IoAdd
                  onClick={handleIconClick}
                  style={{ cursor: "pointer" }}
                />
              )}
            </button>
          </div>
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

          {/*
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
          */}

          {isEditing 
            ? (
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
            ) 
            : <button className={`edit-btn-new ${isEditing && 'enabled'}`} onClick={handleEditToggle}>Edit details <MdEdit /></button>
          }
        </div>
      </div>

      <BankDetails />

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
                <th>Date</th>
                <th>Bid Amount</th>
                <th>Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {bids.slice(0, 5).map((bid) => (
                <tr key={bid.session_id}>
                  <td>{new Date(bid.results_declared_date).toLocaleDateString()}</td>
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