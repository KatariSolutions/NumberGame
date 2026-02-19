import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { verifyToken } from "../apis/auth/verifyToken";
import Loader from "../components/CustomLoader";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children }) => {
  const [isVerified, setIsVerified] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        setIsVerified(false);
        return;
      }

      try {
        const res = await verifyToken({}, token);
        if (res.status === 201) {
          setIsVerified(true);
        } else if (res.status === 403) {
          toast.error(res.message);
          navigate('/403');
        } else if (res.status === 401) {
          toast.error(res.message);
          navigate('/401');
        } else {
          setIsVerified(false);
        }
      } catch (err) {
        //console.log(err);
        setIsVerified(false);
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