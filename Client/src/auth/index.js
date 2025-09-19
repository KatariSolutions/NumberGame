import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './Login';

import Register from './Register';
import ForgotPassword from './ForgotPassword';

function AuthLayout() {
    return (
        <div className="auth_layout">
            <Routes>
                <Route path="/" element={<Navigate to="/auth/login" />} />
                <Route path="/login" element={<Login />}></Route>
                <Route path="/register" element={<Register />}></Route>
                <Route path="/forgot-password" element={<ForgotPassword />}></Route>
            </Routes>
        </div>
    )
}

export default AuthLayout;