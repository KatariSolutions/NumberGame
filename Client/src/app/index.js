import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

function AuthLayout() {
    return (
        <div className="auth_layout">
            <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" />} />
            </Routes>
        </div>
    )
}

export default AuthLayout;