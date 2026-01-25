import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPlayCircle } from 'react-icons/io5';
import { checkUserDetailsAvailableAPI } from '../apis/user/checkUserDetailsAvailableAPI';
import bg from '../gallery/gaming-banner.png';
import { getWalletBalanceAPI } from '../apis/wallet/getWalletBalanceAPI';
import { toast } from 'react-toastify';
import { getGameStatusAPI } from '../apis/games/getGameStatusAPI';

function Dashboard(props) {
  const setShowBanner = props.setShowBanner;
  const setBannerClose = props.setBannerClose;
  const setBannerMessage = props.setBannerMessage;
  const navigate = useNavigate();

  const [isDetailsAvailable, setDetailsAvailable] = useState(false);
  const [isBalanceAvailable, setBalanceAvailable] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  {/*
  const checkProfileStatus = async () => {
    try {
      let userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      let token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!userId || !token) return;
      const res = await checkUserDetailsAvailableAPI(userId, token);
      if (res.status === 201) {
        // ❌ User profile incomplete → Show banner
        if (res.message) {
          setShowBanner(false);
          setDetailsAvailable(true);
        } else {
          setShowBanner(true);
          setBannerMessage('Please complete your profile before start playing!');
        }
      } else if(res.status === 209) {
        toast.error(res.message);
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
      console.error("Error checking profile completeness:", err);
      if(err?.status === 403) {
          navigate('/403');
      }
      if(err?.status === 500) {
        navigate('/500');
      }
    }
  };

  const checkWalletBalance = async () => {
    try {
      let userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      let token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await getWalletBalanceAPI(userId, token);
      //console.log(res)
      if (res.status === 201) {
        if(res.result?.balance > 0){
          setShowBanner(false);
          setBalanceAvailable(true);
        } else {
          setShowBanner(true);
          setBannerMessage('Please recharge your wallet before start playing!');
        }
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
      console.error("Error checking profile completeness:", err);
      if(err?.status === 403) {
          navigate('/403');
      }
      if(err?.status === 500) {
        navigate('/500');
      }
    }
  };
  */}

  const checkGameStatus = async () => {
    try {
      let userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      let token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await getGameStatusAPI(token);
      console.log(res)
      if (res.status === 201) {
        if(res.result?.is_active){
          setIsGameActive(true);
        } else {
          setIsGameActive(false);
          setShowBanner(true);
          setBannerMessage('Game is not active!');
        }
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
      console.error("Error checking profile completeness:", err);
      if(err?.status === 403) {
          navigate('/403');
      }
      if(err?.status === 500) {
        navigate('/500');
      }
    }
  }

  const handleClickGame = () => {
    if(isGameActive){
      navigate('/game/numbergame')
    } else {
      setShowBanner(true);
      setBannerClose(false);
    }
  }

  useEffect(()=>{
    // checkProfileStatus();
    // checkWalletBalance();
    checkGameStatus();
  },[navigate])

  return (
    <div className="dashboard-outer">
      <div className="dashboard-card" style={{ backgroundImage: `url(${bg})` }}>
        <div className="dashboard-header">
          <div className="session-status">
            <span className={`dot ${isGameActive ? 'active' : 'inactive'}`}></span>
            <span className={`status-text ${isGameActive ? 'active' : 'inactive'}`}>
              {isGameActive ? 'Game Active, click to play!' : 'Game is not active!'}
            </span>
          </div>
        </div>

        <div className="dashboard-body">
          <button className={`play-button ${isGameActive ? 'active' : 'inactive'}`} onClick={handleClickGame}>
            <IoPlayCircle className="play-icon" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
