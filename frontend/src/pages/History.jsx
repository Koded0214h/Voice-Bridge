import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementAPI } from '../services/api';

const HistoryPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const navigate = useNavigate();

  // Language name mapping
  const languageNames = {
    'en': 'English',
    'yo': 'Yoruba', 
    'ig': 'Igbo',
    'ha': 'Hausa',
    'pcm': 'Pidgin English'
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const history = await announcementAPI.getHistory();
      setAnnouncements(history);
      console.log('Loaded history:', history);
    } catch (error) {
      setError('Failed to load announcement history');
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioUrl, languageName) => {
    try {
      if (!audioUrl) {
        alert(`No audio available for ${languageName}`);
        return;
      }

      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      alert(`Error playing audio: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const viewAnnouncementDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const closeDetails = () => {
    setSelectedAnnouncement(null);
  };

  const createNewRecording = () => {
    navigate('/mic-setup');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading announcement history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased min-h-screen">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="text-primary p-2 bg-primary/20 rounded-full">
                <span className="material-symbols-outlined text-3xl">history</span>
              </div>
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">VoiceBridge History</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={createNewRecording}
                className="flex items-center gap-2 rounded-lg bg-accent text-gray-800 px-4 py-2 font-medium hover:bg-accent/90 transition-colors"
              >
                <span className="material-symbols-outlined">mic</span>
                <span className="hidden sm:inline">New Recording</span>
              </button>
              <button 
                onClick={goToDashboard}
                className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">campaign</span>
                  <h3 className="text-2xl font-bold text-primary">{announcements.length}</h3>
                  <p className="text-text-light dark:text-text-dark">Total Announcements</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-2">translate</span>
                  <h3 className="text-2xl font-bold text-secondary">
                    {new Set(announcements.flatMap(a => a.languages || [])).size}
                  </h3>
                  <p className="text-text-light dark:text-text-dark">Languages Supported</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-accent mb-2">audio_file</span>
                  <h3 className="text-2xl font-bold text-accent">
                    {announcements.reduce((total, a) => total + Object.keys(a.audio_files || {}).length, 0)}
                  </h3>
                  <p className="text-text-light dark:text-text-dark">Audio Files</p>
                </div>
              </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-6">
                Recent Announcements
              </h2>

              {announcements.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">inbox</span>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No announcements yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6">
                    Record your first announcement to see it here.
                  </p>
                  <button 
                    onClick={createNewRecording}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Create Your First Announcement
                  </button>
                </div>
              ) : (
                announcements.map((announcement, index) => (
                  <div key={announcement.id} className="bg-card-light dark:bg-card-dark rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary">campaign</span>
                            <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
                              Announcement #{announcements.length - index}
                            </h3>
                            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {formatDate(announcement.created_at)}
                            </span>
                          </div>
                          <p className="text-text-light/80 dark:text-text-dark/80 line-clamp-2">
                            {announcement.text}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => viewAnnouncementDetails(announcement)}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Languages and Quick Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                          {announcement.languages?.map(lang => (
                            <span key={lang} className="bg-subtle-light dark:bg-subtle-dark px-3 py-1 rounded-full text-sm">
                              {languageNames[lang] || lang}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          {announcement.audio_files && Object.entries(announcement.audio_files).map(([lang, url]) => (
                            <button
                              key={lang}
                              onClick={() => playAudio(url, languageNames[lang] || lang)}
                              className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">play_arrow</span>
                              {languageNames[lang] || lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Announcement Details Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">
                  Announcement Details
                </h3>
                <button 
                  onClick={closeDetails}
                  className="p-2 hover:bg-subtle-light dark:hover:bg-subtle-dark rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Original Text */}
                <div>
                  <h4 className="font-semibold text-text-light dark:text-text-dark mb-2">Original Text</h4>
                  <div className="bg-subtle-light dark:bg-subtle-dark rounded-xl p-4">
                    <p className="text-text-light dark:text-text-dark">{selectedAnnouncement.text}</p>
                  </div>
                </div>

                {/* Translations */}
                <div>
                  <h4 className="font-semibold text-text-light dark:text-text-dark mb-4">Translations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAnnouncement.translations && Object.entries(selectedAnnouncement.translations).map(([lang, text]) => (
                      <div key={lang} className="bg-subtle-light/50 dark:bg-subtle-dark/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-text-light dark:text-text-dark">
                            {languageNames[lang] || lang}
                          </span>
                          {selectedAnnouncement.audio_files?.[lang] && (
                            <button
                              onClick={() => playAudio(selectedAnnouncement.audio_files[lang], languageNames[lang] || lang)}
                              className="ml-auto bg-primary text-white p-1 rounded-full hover:bg-primary/90 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">play_arrow</span>
                            </button>
                          )}
                        </div>
                        <p className="text-text-light/80 dark:text-text-dark/80 text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Created:</span> {formatDate(selectedAnnouncement.created_at)}
                  </div>
                  <div>
                    <span className="font-semibold">Languages:</span> {selectedAnnouncement.languages?.map(lang => languageNames[lang] || lang).join(', ')}
                  </div>
                  <div>
                    <span className="font-semibold">Tone:</span> {selectedAnnouncement.tone}
                  </div>
                  <div>
                    <span className="font-semibold">ID:</span> {selectedAnnouncement.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;