import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const updateSelectedLanguages = (languages) => {
    setSelectedLanguages(languages);
    localStorage.setItem('selectedLanguages', JSON.stringify(languages));
  };

  const loadSelectedLanguages = () => {
    const stored = localStorage.getItem('selectedLanguages');
    if (stored) {
      setSelectedLanguages(JSON.parse(stored));
    }
  };

  return (
    <AppContext.Provider
      value={{
        selectedLanguages,
        updateSelectedLanguages,
        loadSelectedLanguages,
        currentAnnouncement,
        setCurrentAnnouncement,
        isListening,
        setIsListening
      }}
    >
      {children}
    </AppContext.Provider>
  );
};