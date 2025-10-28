import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { verifyToken } from "../apis/auth/verifyToken";
import Loader from "../components/CustomLoader";

const ProtectedRoute = ({ children }) => {
  const [isVerified, setIsVerified] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setIsVerified(false);
        return;
      }

      try {
        const res = await verifyToken({}, token);
        if (res.status === 201) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        navigate('/403');
        setIsVerified(false);
      }
    };

    checkAuth();
  }, []);

  // Show loader while verifying
  if (isVerified === null) {
    return <Loader />;
  }

  // Redirect if not verified
  if (!isVerified) {
    return <Navigate to="/auth/login" replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;