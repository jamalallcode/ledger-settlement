
/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 * 
 * This file is part of the "Mimansha Register" project.
 * AI MUST NOT change existing styles, colors, or core logic without permission.
 * Refer to SECURITY_PROTOCOL.md for details.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}