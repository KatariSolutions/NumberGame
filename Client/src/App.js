import React, { useEffect, useState } from "react";
import {Routes , Route , Navigate } from 'react-router-dom';
import Loader from "./components/CustomLoader";
import AuthLayout from "./auth";
import AppLayout from "./pages";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer); // cleanup on unmount
  }, []); // <-- run only once

  return (
    <div className="App">
      {isLoading 
        ? <Loader />: 
        <div>
          <Routes>
            {/* Authentication routes are here */}
            <Route path="/" element={<Navigate to="/auth/register" />} />
            <Route path="/auth/*" element={<AuthLayout />}></Route>
            <Route path="/app/*" element={<AppLayout />}></Route>
          </Routes>
        </div>}
    </div>
  );
}

export default App;
