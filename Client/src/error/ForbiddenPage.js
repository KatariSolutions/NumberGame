import React from "react";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <h1>403 – Access Denied</h1>
      <p>You don’t have permission to access this page.</p>
      <button onClick={() => navigate("/auth/login")}>Go Back</button>
    </div>
  );
}