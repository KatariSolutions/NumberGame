import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CustomBanner from '../components/CustomBanner';
import AppHeader from '../components/AppHeader';
import Profile from './Profile';
import Dashboard from './Dashboard';
import Wallet from './Wallet';
import History from './History';
import WalletHistory from './WalletHistory';

function AppLayout() {
    const [bannerClose,setBannerClose] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');

    const navigate = useNavigate();

    const closeBanner = () => {
        setBannerClose(true);
    }

    return (
        <div className="app_layout">
            {
                showBanner && !bannerClose && <CustomBanner message={bannerMessage} closeBanner={closeBanner}/>
            }
            <div className='app_inner_layout'>
                <div className='app_inner_left'>
                    <AppHeader />
                    <Routes>
                        <Route path="/" element={<Navigate to="/app/dashboard" />} />
                        <Route path="/dashboard" element={
                            <Dashboard 
                                setShowBanner={setShowBanner} 
                                setBannerClose={setBannerClose} 
                                setBannerMessage={setBannerMessage}
                            />
                        }/>
                        <Route path="/profile" element={<Profile/>} />
                        <Route path="/wallet" element={<Wallet />}/>
                        <Route path="/wallet/history" element={<WalletHistory />}/>
                        <Route path="/history" element={<History />}/>
                    </Routes>
                </div>
                {
                    /* 
                    <div className='app_inner_right'>
                        <div className='custom-profile'>
    
                        </div>
                    </div>
                    */
                }
            </div>
        </div>
    )
}

export default AppLayout;