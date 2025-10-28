import React from "react";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <h1>401 – Unauthorized</h1>
      <p>Your session has expired or you are not logged in.</p>
      <button onClick={() => navigate("/auth/login")}>Go to Login</button>
    </div>
  );
}