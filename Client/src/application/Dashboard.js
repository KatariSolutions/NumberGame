import React, {useState, useEffect} from 'react';
import { IoPlayCircle } from 'react-icons/io5';
import bg from '../gallery/gaming-banner.png';
import { useNavigate } from 'react-router-dom';
import DiceRoll from './Games/DiceRoll';

function Dashboard(props) {
  const isDetailsAvailable = props.isDetailsAvailable;
  const setShowBanner = props.setShowBanner;
  const setBannerClose = props.setBannerClose;
  const navigate = useNavigate();

  const handleClickGame = () => {
    if(isDetailsAvailable){
      navigate('/game/numbergame')
    } else {
      setShowBanner(true);
      setBannerClose(false);
    }
  }

  return (
    <div className="dashboard-outer">
      <div className="dashboard-card" style={{ backgroundImage: `url(${bg})` }}>
        <div className="dashboard-header">
          <h2 className="dashboard-title"></h2>
          <div className="session-status">
            <span className="dot"></span>
            <span className="status-text">Active Session</span>
          </div>
        </div>

        <div className="dashboard-body">
          <button className="play-button" onClick={handleClickGame}>
            <IoPlayCircle className="play-icon" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
