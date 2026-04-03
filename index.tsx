
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
import { ReceiverProvider } from './src/contexts/ReceiverContext';

const rootElement = document.getElementById('root');

window.onerror = function(message, source, lineno, colno, error) {
  const errorMsg = `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nStack: ${error?.stack}`;
  console.error(errorMsg);
  window.alert(errorMsg);
  return false;
};

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ReceiverProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
          </Routes>
        </BrowserRouter>
      </ReceiverProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}