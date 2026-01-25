import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./auth";
import AppLayout from "./application";
import ProtectedRoute from "./utils/ProtectedRoute";

import UnauthorizedPage from "./error/UnauthorizedPage";
import ForbiddenPage from "./error/ForbiddenPage";
import NotFoundPage from "./error/NotFoundPage";
import ServerErrorPage from "./error/ServerErrorPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GamesLayout from "./application/Games";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      
      <div className="App">
        <Routes>
          <Route path="/401" element={<UnauthorizedPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<ServerErrorPage />} />

          <Route path="/" element={<Navigate to="/landing-page" />} />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/auth/*" element={<AuthLayout />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/game/*"
            element={
              <ProtectedRoute>
                <GamesLayout />
                {/* <GamesLayoutNew /> */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
