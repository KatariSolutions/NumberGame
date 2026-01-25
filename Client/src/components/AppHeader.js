import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../gallery/logo.svg';
import {
  IoMenu,
  IoPlayCircle,
  IoPersonCircle,
  IoSettingsSharp,
  IoLogOut,
  IoWallet
} from 'react-icons/io5';
import { LuHistory } from "react-icons/lu";
import { deactivateSessionAPI } from '../apis/auth/deactivateSessionAPI';
import { toast } from 'react-toastify';

function AppHeader() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!userId || !token) {
      console.log("No userId or token found!");
      navigate("/auth/login");
      return;
    }

    try {
      const res = await deactivateSessionAPI(userId, token);

      if (res.status === 201) {
        // Clear local/session storage
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");

        navigate("/auth/login");
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        toast.error("Failed to deactivate session:");
      }
    } catch (err) {
      toast.error("Logout error");
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

  const menuItems = [
    { label: 'Play', icon: <IoPlayCircle />, action: () => navigate('/app/dashboard') },
    { label: 'Profile', icon: <IoPersonCircle />, action: () => navigate('/app/profile') },
    { label: 'History', icon: <LuHistory />, action: () => navigate('/app/history') },
    { label: 'Wallet', icon: <IoWallet />, action: () => navigate('/app/wallet') },
    { label: 'Logout', icon: <IoLogOut />, action: handleLogout }
  ];

  return (
    <>
      <header className="app-header">
        <div className="header-logo">
          <img src={logo} alt="logo" />
        </div>

        <nav className="header-menu">
          {menuItems.map((item, idx) => (
            <button key={idx} onClick={item.action} className="menu-item">
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hamburger" onClick={() => setSidebarOpen(true)}>
          <IoMenu />
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <img src={logo} alt="logo" />
              <button className="close-btn" onClick={() => setSidebarOpen(false)}>
                ✕
              </button>
            </div>

            <div className="sidebar-menu">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    setSidebarOpen(false);
                  }}
                  className="sidebar-item"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-footbar">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="footbar-item"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default AppHeader;