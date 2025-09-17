import React from 'react';
import { createRoot } from 'react-dom/client';  // <-- use createRoot
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = createRoot(document.getElementById('root')); // <-- new root

root.render(
  <Router>
    <App />
  </Router>
);

reportWebVitals();