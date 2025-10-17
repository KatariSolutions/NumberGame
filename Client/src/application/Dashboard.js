import React from 'react';
import { IoPlayCircle } from 'react-icons/io5';
import bg from '../gallery/gaming-banner.png';

function Dashboard() {
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
          <button className="play-button">
            <IoPlayCircle className="play-icon" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
