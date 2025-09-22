import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { announcementAPI } from '../services/api';

const ListeningDashboard = () => {
  const [isListening, setIsListening] = useState(true);
  const [isTranslationsOpen, setIsTranslationsOpen] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingLanguage, setCurrentPlayingLanguage] = useState(null);
  const audioRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Language name mapping
  const languageNames = {
    'en': 'English',
    'yo': 'Yoruba', 
    'ig': 'Igbo',
    'ha': 'Hausa',
    'pcm': 'Pidgin English'
  };

  // Load announcement data from localStorage or route state
  useEffect(() => {
    const loadAnnouncementData = () => {
      try {
        // Try to get from route state first
        if (location.state?.announcement) {
          const announcement = location.state.announcement;
          setCurrentAnnouncement(announcement);
          setTranscript(announcement.text);
          console.log('Loaded announcement from route state:', announcement);
        } else {
          // Fallback to localStorage
          const storedAnnouncement = localStorage.getItem('currentAnnouncement');
          const storedLanguages = localStorage.getItem('selectedLanguages');
          
          if (storedAnnouncement) {
            const announcement = JSON.parse(storedAnnouncement);
            setCurrentAnnouncement(announcement);
            setTranscript(announcement.text);
            console.log('Loaded announcement from localStorage:', announcement);
          }
          
          if (storedLanguages) {
            const languagesData = JSON.parse(storedLanguages);
            setSelectedLanguages(languagesData.languageObjects || []);
          }
        }
      } catch (error) {
        console.error('Error loading announcement data:', error);
      }
    };

    loadAnnouncementData();
  }, [location.state]);

  // Get translations from current announcement
  const getTranslations = () => {
    if (!currentAnnouncement?.translations) return [];
    
    return Object.entries(currentAnnouncement.translations).map(([code, text]) => ({
      language: languageNames[code] || code,
      code: code,
      flag: "https://flagcdn.com/w320/ng.png",
      text: text,
      audioUrl: currentAnnouncement.audio_files?.[code]
    }));
  };

  // Play audio for a specific language
  const playAudio = async (languageCode, languageName) => {
    try {
      const audioUrls = currentAnnouncement?.audio_files || {};
      const audioUrl = audioUrls[languageCode];
      
      if (!audioUrl) {
        console.warn(`No audio URL found for ${languageName}`);
        alert(`No audio available for ${languageName}`);
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlayingAudio(true);
      setCurrentPlayingLanguage(languageName);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        setCurrentPlayingLanguage(null);
        audioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlayingAudio(false);
        setCurrentPlayingLanguage(null);
        audioRef.current = null;
        alert(`Error playing audio for ${languageName}. Please check the audio file.`);
      };

      audio.oncanplaythrough = () => {
        console.log('Audio can play through');
      };

      audio.onloadstart = () => {
        console.log('Audio loading started');
      };

      await audio.play();
      console.log(`Playing audio for ${languageName}: ${audioUrl}`);

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setCurrentPlayingLanguage(null);
      audioRef.current = null;
      alert(`Error playing audio: ${error.message}`);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    setCurrentPlayingLanguage(null);
  };

  // Simulate real-time transcription
  useEffect(() => {
    if (!isListening || isReplaying || transcript) return;

    let currentIndex = 0;
    const demoText = currentAnnouncement?.text || "Welcome to VoiceBridge. Your announcement will appear here once processed.";
    const words = demoText.split(' ');
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setTranscript(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
        setAudioLevel(Math.random() * 100);
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isListening, isReplaying, transcript, currentAnnouncement]);

  // Simulate replay progress
  useEffect(() => {
    if (!isReplaying) return;

    const replayInterval = setInterval(() => {
      setReplayProgress(prev => {
        if (prev >= 100) {
          clearInterval(replayInterval);
          setIsReplaying(false);
          return 0;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(replayInterval);
  }, [isReplaying]);

  const handlePauseListening = () => {
    setIsListening(!isListening);
    if (isReplaying) {
      setIsReplaying(false);
      setReplayProgress(0);
    }
  };

  const handleStop = () => {
    navigate('/mic-setup');
  };

  const handleReplay = () => {
    if (isReplaying) return;
    setIsReplaying(true);
    setIsListening(false);
    setReplayProgress(0);
    setTranscript('');
  };

  const handleNewRecording = () => {
    localStorage.removeItem('currentAnnouncement');
    navigate('/mic-setup');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  // Audio level visualization
  const AudioVisualizer = () => (
    <div className="flex items-center gap-1">
      {[20, 40, 60, 80, 100].map((level) => (
        <div
          key={level}
          className={`w-1 rounded-full transition-all duration-200 ${
            audioLevel > level ? 'bg-green-500' : 'bg-green-200'
          }`}
          style={{ height: `${level / 5}px` }}
        />
      ))}
    </div>
  );

  const translations = getTranslations();
  const hasTranslations = translations.length > 0;

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased min-h-screen">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="text-primary p-2 bg-primary/20 rounded-full">
                <span className="material-symbols-outlined text-3xl">record_voice_over</span>
              </div>
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">VoiceBridge</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleNewRecording}
                className="flex items-center gap-2 rounded-lg bg-accent text-gray-800 px-4 py-2 font-medium hover:bg-accent/90 transition-colors"
              >
                <span className="material-symbols-outlined">mic</span>
                <span className="hidden sm:inline">New Recording</span>
              </button>
              <button 
                onClick={handleViewHistory}
                className="flex items-center gap-2 rounded-lg bg-secondary text-white px-4 py-2 font-medium hover:bg-secondary/90 transition-colors"
              >
                <span className="material-symbols-outlined">history</span>
                <span className="hidden sm:inline">History</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8">
            {/* Announcement Info Card */}
            {currentAnnouncement && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Announcement Processed Successfully</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Created: {new Date(currentAnnouncement.created_at).toLocaleString()} • 
                      Languages: {currentAnnouncement.languages?.map(lang => languageNames[lang] || lang).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-lg overflow-hidden">
              {/* Status Bar */}
              <div className={`p-4 flex items-center gap-3 ${
                isReplaying 
                  ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300'
                  : isListening 
                  ? 'bg-green-500/20 text-green-800 dark:text-green-300' 
                  : 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300'
              }`}>
                <span className={`material-symbols-outlined ${
                  isReplaying ? 'animate-spin' : isListening ? 'animate-pulse' : ''
                }`}>
                  {isReplaying ? 'replay' : isListening ? 'mic' : 'pause'}
                </span>
                <p className="font-semibold">
                  {isReplaying 
                    ? `Replaying announcement... ${replayProgress}%` 
                    : isListening 
                    ? 'Live transcription mode' 
                    : 'Transcription paused'}
                </p>
                {(isListening || isReplaying) && <AudioVisualizer />}
              </div>

              {/* Transcript Content */}
              <div className="p-6 space-y-4">
                <div className="bg-subtle-light dark:bg-subtle-dark rounded-xl p-6 min-h-[150px] max-h-[300px] overflow-y-auto">
                  <p className="text-lg text-text-light dark:text-text-dark whitespace-pre-wrap leading-relaxed">
                    {transcript || (currentAnnouncement ? currentAnnouncement.text : 'Processing your announcement...')}
                  </p>
                </div>

                {/* Translations Section */}
                {hasTranslations ? (
                  <div>
                    <details open={isTranslationsOpen} className="group">
                      <summary className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors list-none">
                        <h2 className="text-xl font-bold">Translations & Audio Playback</h2>
                        <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">
                          expand_more
                        </span>
                      </summary>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {translations.map((translation, index) => (
                          <div key={index} className="bg-subtle-light/50 dark:bg-subtle-dark/50 p-4 rounded-xl border">
                            <div className="flex items-center gap-3 mb-3">
                              <img 
                                alt={`${translation.language} Flag`} 
                                className="w-6 h-4 object-cover rounded-sm"
                                src={translation.flag}
                              />
                              <h3 className="font-bold text-text-light dark:text-text-dark flex-1">
                                {translation.language}
                              </h3>
                              {translation.audioUrl && (
                                <button
                                  onClick={() => isPlayingAudio && currentPlayingLanguage === translation.language 
                                    ? stopAudio() 
                                    : playAudio(translation.code, translation.language)
                                  }
                                  className={`p-2 rounded-full transition-colors ${
                                    isPlayingAudio && currentPlayingLanguage === translation.language
                                      ? 'bg-red-500 text-white animate-pulse'
                                      : 'bg-primary text-white hover:bg-primary/90'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {isPlayingAudio && currentPlayingLanguage === translation.language ? 'stop' : 'play_arrow'}
                                  </span>
                                </button>
                              )}
                            </div>
                            <p className="text-text-light/80 dark:text-text-dark/80 text-sm leading-relaxed mb-3">
                              {translation.text}
                            </p>
                            {translation.audioUrl && (
                              <div className="text-xs text-gray-500 flex justify-between items-center">
                                <span>Click play to listen</span>
                                {isPlayingAudio && currentPlayingLanguage === translation.language && (
                                  <span className="flex gap-1">
                                    <div className="w-1 h-3 bg-primary rounded-full animate-pulse"></div>
                                    <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No translations available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handlePauseListening}
                disabled={isReplaying || !transcript}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-secondary text-white px-8 py-3 font-bold shadow-lg hover:bg-secondary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">
                  {isListening ? 'pause_circle' : 'play_circle'}
                </span>
                {isListening ? 'Pause' : 'Resume'}
              </button>
              
              <button 
                onClick={handleStop}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white px-8 py-3 font-bold shadow-lg hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">mic</span>
                New Recording
              </button>
              
              <button 
                onClick={handleReplay}
                disabled={!transcript || isReplaying}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-8 py-3 font-bold shadow-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">
                  {isReplaying ? 'hourglass_top' : 'replay'}
                </span>
                {isReplaying ? 'Replaying...' : 'Replay'}
              </button>

              <button 
                onClick={handleViewHistory}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-accent text-gray-800 px-8 py-3 font-bold shadow-lg hover:bg-accent/90 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">history</span>
                View History
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListeningDashboard;