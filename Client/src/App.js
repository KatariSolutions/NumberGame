import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./auth";
import AppLayout from "./application";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />
        <Route path="/auth/*" element={<AuthLayout />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
