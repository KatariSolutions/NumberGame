import React, { useEffect, useState } from "react";
import Loader from "./components/CustomLoader";

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
      {isLoading ? <Loader />: <h1>Finished</h1>}
    </div>
  );
}

export default App;
