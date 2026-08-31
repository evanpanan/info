import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from './components/AppShell';
import IRPRHomePage from './components/IRPRHomePage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell>
      <IRPRHomePage />
    </AppShell>
  </React.StrictMode>
);
