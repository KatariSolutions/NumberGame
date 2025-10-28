import React from "react";
import { useNavigate } from "react-router-dom";

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <h1>500 – Server Error</h1>
      <p>Oops! Something went wrong on our side.</p>
      <button onClick={() => navigate("/")}>Try Again</button>
    </div>
  );
}