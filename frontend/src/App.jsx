import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SmartInput from './components/SmartInput';
import HistoryLog from './components/HistoryLog';
import InventorySearch from './components/InventorySearch';
import AgentStatus from './components/AgentStatus';
import Settings from './components/Settings';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<SmartInput />} />
            <Route path="history" element={<HistoryLog />} />
            <Route path="inventory" element={<InventorySearch />} />
            <Route path="agents" element={<AgentStatus />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
