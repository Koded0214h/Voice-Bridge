import React from 'react';
import { Link } from 'react-router-dom';

const VoiceBridge = () => {
  return (
    <div className="bg-background font-display text-text-light dark:bg-gray-900 dark:text-text-dark min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <main className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-smooth p-8 text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full animate-ping"></div>
            <div className="relative flex items-center justify-center h-full w-full bg-primary/10 dark:bg-primary/20 rounded-full">
              <span className="material-symbols-outlined text-primary text-5xl">
                mic
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Never miss an announcement again.
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            VoiceBridge captures announcements, translates them, and delivers them in your language.
          </p>
          
          <div className="mt-8 flex flex-col space-y-4">
            <Link to="/language">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-DEFAULT hover:bg-primary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined">
                language
              </span>
              Choose Language
            </button>
            </Link>
            
            <Link to="/mic-setup">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-white font-bold rounded-DEFAULT hover:bg-secondary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined">
                mic
              </span>
              Connect Microphone
            </button>
            </Link>
            
            <Link to="/dashboard">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-accent text-gray-800 font-bold rounded-DEFAULT hover:bg-accent/90 transition-colors shadow-lg animate-pulse">
              <span className="material-symbols-outlined">
                play_arrow
              </span>
              Start Listening
            </button>
            </Link>
            
            <button className="w-full text-gray-500 dark:text-gray-400 font-medium underline hover:text-primary dark:hover:text-primary transition-colors">
              View Translations
            </button>
          </div>
        </main>
        
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by VoiceBridge & Spitch· Real-time Speech to Text + Translation</p>
        </footer>
      </div>
    </div>
  );
};

export default VoiceBridge;