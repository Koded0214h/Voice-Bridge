import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VoiceBridge from './pages/VoiceBridge';
import { AppProvider } from './context/AppContext';
import LanguageSelection from './pages/LanguageSelection';
import MicrophoneSetup from './pages/MicrophoneSetup';
import ListeningDashboard from './pages/ListeningDashboard';
import HistoryPage from './pages/History';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<VoiceBridge />} />
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/mic-setup" element={<MicrophoneSetup />} />
            <Route path="/dashboard" element={<ListeningDashboard />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;