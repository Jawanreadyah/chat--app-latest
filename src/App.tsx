import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { GlobalCallHandler } from './components/call/GlobalCallHandler';

function App() {
  return (
    <BrowserRouter>
      <GlobalCallHandler />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;