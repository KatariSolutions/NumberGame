import React, { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import CustomBanner from '../components/CustomBanner';
import AppHeader from '../components/AppHeader';
import Profile from './Profile';
import Dashboard from './Dashboard';

function AppLayout() {
    const [bannerClose,SetBannerClose] = useState(false);

    const closeBanner = () => {
        SetBannerClose(true);
    }

    return (
        <div className="app_layout">
            {
                !bannerClose && <CustomBanner message={'Please complete your profile before start playing!'} closeBanner={closeBanner}/>
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