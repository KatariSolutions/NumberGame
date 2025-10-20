import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import CustomBanner from '../components/CustomBanner';
import AppHeader from '../components/AppHeader';
import Profile from './Profile';
import Dashboard from './Dashboard';
import { checkUserDetailsAvailableAPI } from '../apis/user/checkUserDetailsAvailableAPI';

function AppLayout() {
    const [bannerClose,SetBannerClose] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    const closeBanner = () => {
        SetBannerClose(true);
    }

    useEffect(() => {
        const checkProfileStatus = async () => {
          try {
            let userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
            let token = sessionStorage.getItem("token") || localStorage.getItem("token");

            if (!userId || !token) return;

            const res = await checkUserDetailsAvailableAPI(userId, token);
            console.log(res)

            if (res.status === 203 || res.message === false) {
              // ❌ User profile incomplete → Show banner
              setShowBanner(true);
            } else {
              // ✅ User profile complete
              setShowBanner(false);
            }
          } catch (err) {
            console.error("Error checking profile completeness:", err);
          }
        };

        checkProfileStatus();
    }, []);


    return (
        <div className="app_layout">
            {
                showBanner && !bannerClose && <CustomBanner message={'Please complete your profile before start playing!'} closeBanner={closeBanner}/>
            }
            <div className='app_inner_layout'>
                <div className='app_inner_left'>
                    <AppHeader />
                    <Routes>
                        <Route path="/" element={<Navigate to="/app/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile/>} />
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