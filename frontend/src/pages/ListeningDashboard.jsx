import React, { useState, useEffect } from 'react';

const ListeningDashboard = () => {
  const [isListening, setIsListening] = useState(true);
  const [isTranslationsOpen, setIsTranslationsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const translations = [
    {
      language: "Yoruba",
      flag: "https://flagcdn.com/w320/ng.png",
      text: "Àǹfààní yìí yóò wà ní kíkọ sílẹ̀ ní ìgbà gan-an gẹ́gẹ́ bí ó ti ń wáyé."
    },
    {
      language: "Igbo",
      flag: "https://flagcdn.com/w320/ng.png",
      text: "Mkpu a ga-edegharị ya ozugbo ka a na-ekwu ya."
    },
    {
      language: "Hausa",
      flag: "https://flagcdn.com/w320/ng.png",
      text: "Za a rubuta sanarwar nan take yayin da ake yinta."
    }
  ];

  const fullTranscript = `The announcement will be transcribed in real-time as it is being made. 

Latest update: There will be a scheduled maintenance tomorrow from 2:00 AM to 4:00 AM. All systems will be temporarily unavailable during this period.

Please ensure all your work is saved before the maintenance window. The IT department will be available to assist with any urgent matters.`;

  // Simulate real-time transcription
  useEffect(() => {
    if (!isListening || isReplaying) return;

    let currentIndex = 0;
    const words = fullTranscript.split(' ');
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setTranscript(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
        
        // Simulate audio levels
        setAudioLevel(Math.random() * 100);
      } else {
        clearInterval(interval);
      }
    }, 200); // Add a word every 200ms

    return () => clearInterval(interval);
  }, [isListening, isReplaying, fullTranscript]);

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
    setIsListening(false);
    setIsReplaying(false);
    setReplayProgress(0);
    setTranscript('');
    setAudioLevel(0);
    
    // Simulate stop confirmation
    console.log('🛑 Listening stopped');
    
    // Show temporary confirmation
    setTimeout(() => {
      // You could add a toast notification here
    }, 500);
  };

  const handleReplay = () => {
    if (isReplaying) return;
    
    setIsReplaying(true);
    setIsListening(false);
    setReplayProgress(0);
    
    // Clear current transcript and simulate replay
    setTranscript('');
    
    console.log('🔁 Replaying announcement...');
    
    // Simulate replay by quickly building up the transcript
    let replayIndex = 0;
    const words = fullTranscript.split(' ');
    const replayInterval = setInterval(() => {
      if (replayIndex < words.length) {
        setTranscript(prev => prev + (prev ? ' ' : '') + words[replayIndex]);
        replayIndex++;
      } else {
        clearInterval(replayInterval);
      }
    }, 100); // Faster for replay
  };

  const simulateNewAnnouncement = () => {
    setTranscript('');
    setIsListening(true);
    setIsReplaying(false);
    setReplayProgress(0);
    
    console.log('🎤 Simulating new announcement...');
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
                onClick={simulateNewAnnouncement}
                className="flex items-center gap-2 rounded-lg bg-accent text-gray-800 px-4 py-2 font-medium hover:bg-accent/90 transition-colors"
              >
                <span className="material-symbols-outlined">campaign</span>
                <span className="hidden sm:inline">Simulate Announcement</span>
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 rounded-lg bg-subtle-light dark:bg-subtle-dark px-4 py-2 font-medium text-text-light dark:text-text-dark hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined">language</span>
                  <span className="hidden sm:inline">Change Language</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              </div>
              <button className="p-2 rounded-full hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8">
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
                    ? 'Listening for announcements...' 
                    : 'Listening paused'}
                </p>
                {(isListening || isReplaying) && <AudioVisualizer />}
              </div>

              {/* Replay Progress Bar */}
              {isReplaying && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
                  <div 
                    className="bg-blue-500 h-1 transition-all duration-100"
                    style={{ width: `${replayProgress}%` }}
                  />
                </div>
              )}

              {/* Transcript Content */}
              <div className="p-6 space-y-4">
                <div className="bg-subtle-light dark:bg-subtle-dark rounded-xl p-6 min-h-[150px] max-h-[300px] overflow-y-auto">
                  <p className="text-lg text-text-light dark:text-text-dark whitespace-pre-wrap leading-relaxed">
                    {transcript || (isReplaying ? 'Preparing replay...' : 'Waiting for announcement...')}
                  </p>
                  {(isListening || isReplaying) && transcript && (
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-gray-500">
                        {Math.ceil(transcript.split(' ').length / 200 * 100)}% complete
                      </span>
                    </div>
                  )}
                </div>

                {/* Translations Section */}
                <div>
                  <details 
                    open={isTranslationsOpen}
                    className="group"
                    onToggle={(e) => setIsTranslationsOpen(e.target.open)}
                  >
                    <summary className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors list-none">
                      <h2 className="text-xl font-bold">Translations</h2>
                      <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {translations.map((translation, index) => (
                        <div key={index} className="bg-subtle-light/50 dark:bg-subtle-dark/50 p-4 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <img 
                              alt={`${translation.language} Flag`} 
                              className="w-6 h-4 object-cover rounded-sm"
                              src={translation.flag}
                            />
                            <h3 className="font-bold text-text-light dark:text-text-dark">
                              {translation.language}
                            </h3>
                          </div>
                          <p className="text-text-light/80 dark:text-text-dark/80 text-sm leading-relaxed">
                            {translation.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handlePauseListening}
                disabled={isReplaying}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-secondary text-white px-8 py-3 font-bold shadow-lg hover:bg-secondary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">
                  {isListening ? 'pause_circle' : 'play_circle'}
                </span>
                {isListening ? 'Pause Listening' : 'Resume Listening'}
              </button>
              
              <button 
                onClick={handleStop}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white px-8 py-3 font-bold shadow-lg hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">stop_circle</span>
                Stop Listening
              </button>
              
              <button 
                onClick={handleReplay}
                disabled={!transcript || isReplaying}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-8 py-3 font-bold shadow-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">
                  {isReplaying ? 'hourglass_top' : 'replay'}
                </span>
                {isReplaying ? 'Replaying...' : 'Replay Announcement'}
              </button>
            </div>

            {/* Status Information */}
            <div className="text-center text-sm text-gray-500">
              <p>
                {isReplaying 
                  ? `Replay in progress: ${replayProgress}% complete` 
                  : isListening 
                  ? 'Active listening - capturing audio in real-time' 
                  : 'Listening paused - ready to resume'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListeningDashboard;