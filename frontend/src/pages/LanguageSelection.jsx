import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementAPI } from '../services/api';

const LanguageSelection = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle', 'testing', 'connected', 'error'
  const navigate = useNavigate();

  const nigerianLanguages = [
    {
      name: "Yoruba",
      code: "yo",
      flag: "https://flagcdn.com/w320/ng.png"
    },
    {
      name: "Igbo", 
      code: "ig",
      flag: "https://flagcdn.com/w320/ng.png"
    },
    {
      name: "Hausa",
      code: "ha", 
      flag: "https://flagcdn.com/w320/ng.png"
    },
    {
      name: "Pidgin English",
      code: "pcm",
      flag: "https://flagcdn.com/w320/ng.png"
    },
    {
      name: "English",
      code: "en",
      flag: "https://flagcdn.com/w320/ng.png"
    }
  ];

  // Test backend connection on component mount
  const testBackendConnection = async () => {
    setConnectionStatus('testing');
    try {
      // Since you don't have a test endpoint, let's try to fetch history
      await announcementAPI.getHistory();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Backend connection test failed:', error);
    }
  };

  const handleLanguageSelect = (language) => {
    setError('');
    const isSelected = selectedLanguages.some(lang => lang.code === language.code);
    
    if (isSelected) {
      setSelectedLanguages(prev => prev.filter(lang => lang.code !== language.code));
    } else {
      setSelectedLanguages(prev => [...prev, language]);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare languages for backend
      const backendLanguages = selectedLanguages.map(lang => lang.code);
      
      // Test backend connection first
      await testBackendConnection();
      
      if (connectionStatus === 'error') {
        setError('Cannot connect to backend server. Please make sure your Django server is running on port 8000.');
        setIsLoading(false);
        return;
      }

      // Store selected languages for use in other components
      const languageData = {
        languages: backendLanguages,
        languageObjects: selectedLanguages,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('selectedLanguages', JSON.stringify(languageData));
      console.log('Languages saved to localStorage:', languageData);

      // Navigate to microphone setup
      navigate('/mic-setup');
      
    } catch (err) {
      setError('Failed to connect to backend server. Please check if the server is running.');
      console.error('Connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isLanguageSelected = (languageCode) => {
    return selectedLanguages.some(lang => lang.code === languageCode);
  };

  return (
    <div className="bg-background-light font-sans min-h-screen">
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary">
                Select your preferred language
              </h1>
              <p className="text-gray-600 mt-2">
                Choose one or more languages for translation
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedLanguages.length} language(s)
              </p>
              
              {/* Connection Status */}
              <div className="mt-4">
                {connectionStatus === 'testing' && (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    Testing backend connection...
                  </div>
                )}
                {connectionStatus === 'connected' && (
                  <div className="text-green-600 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Backend connected successfully
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="text-red-600 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    Cannot connect to backend
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  {error}
                </div>
                {connectionStatus === 'error' && (
                  <p className="text-sm mt-2">
                    Make sure your Django server is running: <code className="bg-gray-200 px-1 rounded">python manage.py runserver</code>
                  </p>
                )}
              </div>
            )}

            {/* Language Selection */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {nigerianLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  disabled={isLoading}
                  className={`w-full flex items-center p-4 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLanguageSelected(language.code)
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-neutral-white border-2 border-gray-200'
                  }`}
                >
                  <div 
                    className="w-20 h-14 rounded-lg bg-cover bg-center mr-4 border"
                    style={{ backgroundImage: `url('${language.flag}')` }}
                  ></div>
                  <p className="text-lg font-semibold text-gray-800 flex-grow text-left">
                    {language.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {isLanguageSelected(language.code) && (
                      <span className="material-symbols-outlined text-primary text-2xl">
                        check_circle
                      </span>
                    )}
                    <span className="material-symbols-outlined text-gray-400">
                      chevron_right
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
        
        <footer className="p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl mx-auto">
            <button 
              onClick={handleContinue}
              disabled={isLoading || selectedLanguages.length === 0}
              className="w-full bg-accent text-primary font-bold py-4 px-6 rounded-2xl shadow-lg hover:opacity-90 transition-all duration-300 text-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  Connecting to backend...
                </div>
              ) : (
                `Confirm & Continue (${selectedLanguages.length} selected)`
              )}
            </button>
            
            {/* Debug info - Always show in development */}
            <div className="mt-4 p-2 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Backend URL:</strong> {import.meta.env.VITE_API_URL}<br/>
                <strong>Selected languages:</strong> {selectedLanguages.map(l => l.code).join(', ')}<br/>
                <strong>LocalStorage key:</strong> selectedLanguages
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LanguageSelection;