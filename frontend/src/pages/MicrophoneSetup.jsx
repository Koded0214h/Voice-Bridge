import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementAPI } from '../services/api';

const MicrophoneSetup = () => {
  const [microphoneStatus, setMicrophoneStatus] = useState('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  // Get selected languages from localStorage
  const getSelectedLanguages = () => {
    try {
      const stored = localStorage.getItem('selectedLanguages');
      if (stored) {
        const data = JSON.parse(stored);
        return data.languages || [];
      }
    } catch (error) {
      console.error('Error reading selected languages:', error);
    }
    return [];
  };

  const handleGrantAccess = async () => {
    try {
      setError('');
      setRecordingStatus('Requesting microphone permission...');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      audioStreamRef.current = stream;
      setMicrophoneStatus('connected');
      setupMediaRecorder(stream);
      setRecordingStatus('Microphone ready! Click "Start Recording" to begin.');
      
      console.log('Microphone access granted');
    } catch (error) {
      setMicrophoneStatus('error');
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
      console.error('Microphone access denied:', error);
    }
  };

  const setupMediaRecorder = (stream) => {
    try {
      // Try different mime types for better browser compatibility
      const options = { 
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm;codecs=opus' 
      };

      // Fallback for browsers that don't support webm with opus
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          await sendAudioToBackend();
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error occurred. Please try again.');
        stopRecording();
      };

      console.log('MediaRecorder setup complete with mimeType:', options.mimeType);
    } catch (error) {
      console.error('MediaRecorder setup failed:', error);
      setError('Failed to setup recording. Please refresh and try again.');
    }
  };

  const startRecording = () => {
    const selectedLanguages = getSelectedLanguages();
    if (selectedLanguages.length === 0) {
      setError('No languages selected. Please go back and select languages first.');
      return;
    }

    if (mediaRecorderRef.current && microphoneStatus === 'connected') {
      audioChunksRef.current = []; // Clear previous chunks
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setMicrophoneStatus('recording');
      setRecordingStatus('Recording... Speak now!');
      setError('');
      
      console.log('Started recording audio. Selected languages:', selectedLanguages);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMicrophoneStatus('processing');
      setRecordingStatus('Processing audio...');
      
      console.log('Stopped recording audio');
    }
  };

  const sendAudioToBackend = async () => {
    try {
      setIsProcessing(true);
      setRecordingStatus('Sending audio to server for transcription...');

      const selectedLanguages = getSelectedLanguages();
      if (selectedLanguages.length === 0) {
        throw new Error('No languages selected');
      }

      // Create audio blob
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Create audio file for upload
      const audioFile = new File([audioBlob], 'recording.webm', { type: mimeType });

      console.log('Sending to backend:', {
        fileSize: audioFile.size,
        fileType: audioFile.type,
        languages: selectedLanguages
      });

      // Send to Django backend /transcribe/ endpoint
      const response = await announcementAPI.transcribeAudio(
        audioFile, 
        selectedLanguages, 
        'neutral'
      );

      // Store the result and navigate to dashboard
      localStorage.setItem('currentAnnouncement', JSON.stringify(response));
      setRecordingStatus('Audio processed successfully! Redirecting to dashboard...');
      
      console.log('Audio processed successfully:', response);

      // Navigate to dashboard with the result
      setTimeout(() => {
        navigate('/dashboard', { state: { announcement: response } });
      }, 2000);

    } catch (error) {
      console.error('Error sending audio to backend:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || error.message;
      setError(`Processing failed: ${errorMessage}`);
      setRecordingStatus('Processing failed');
      setMicrophoneStatus('connected'); // Go back to ready state
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = []; // Clear chunks
    }
  };

  const cleanup = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
    setMicrophoneStatus('disconnected');
    setRecordingStatus('');
    setError('');
  };

  const goBack = () => {
    cleanup();
    navigate('/');
  };

  const getSelectedLanguagesText = () => {
    const languages = getSelectedLanguages();
    if (languages.length === 0) return 'No languages selected';
    return `Selected: ${languages.join(', ')}`;
  };

  return (
    <div className="bg-background font-display min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-secondary mb-4">
            Connect your microphone
          </h1>
          <p className="text-lg text-text-light mb-8">
            Allow VoiceBridge to use your device's microphone to capture announcements.
          </p>

          {/* Selected Languages Info */}
          <div className="mb-6 p-3 bg-primary/10 rounded-lg">
            <p className="text-primary font-medium">{getSelectedLanguagesText()}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
              {error.includes('Cannot connect') && (
                <p className="text-sm mt-2">
                  Make sure your Django server is running on port 8000
                </p>
              )}
            </div>
          )}

          {/* Status Message */}
          {recordingStatus && !error && (
            <div className={`mb-4 p-3 rounded-lg border ${
              recordingStatus.includes('failed') || recordingStatus.includes('error') 
                ? 'bg-red-100 border-red-400 text-red-700'
                : recordingStatus.includes('Processing') || recordingStatus.includes('Sending')
                ? 'bg-blue-100 border-blue-400 text-blue-700'
                : 'bg-green-100 border-green-400 text-green-700'
            }`}>
              <p className="font-medium">{recordingStatus}</p>
            </div>
          )}

          {/* Grant Access Button */}
          {microphoneStatus === 'disconnected' && (
            <button 
              onClick={handleGrantAccess}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95 mb-4"
            >
              <span className="material-symbols-outlined text-3xl">mic</span>
              <span className="text-xl">Grant Mic Access</span>
            </button>
          )}

          {/* Recording Controls */}
          {microphoneStatus === 'connected' && (
            <div className="space-y-4 mb-4">
              <button 
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-3 bg-accent text-gray-800 font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-accent/90 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl">play_arrow</span>
                <span className="text-xl">Start Recording</span>
              </button>
            </div>
          )}

          {microphoneStatus === 'recording' && (
            <div className="space-y-4 mb-4">
              <button 
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-3 bg-danger text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-danger/90 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl">stop</span>
                <span className="text-xl">Stop Recording</span>
              </button>
              
              {/* Recording Animation */}
              <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-6 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-6 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-6 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-primary font-medium">Recording... Speak now!</span>
              </div>
            </div>
          )}

          {microphoneStatus === 'processing' && (
            <div className="space-y-4 mb-4">
              <div className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="text-xl">Processing...</span>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="mt-8 space-y-4">
            {/* Microphone Status */}
            <div className={`flex items-center p-4 rounded-xl border transition-all duration-300 ${
              ['connected', 'recording', 'processing'].includes(microphoneStatus)
                ? 'bg-success/10 border-success/20' 
                : 'bg-gray-100/50 border-gray-200/50 opacity-50'
            }`}>
              <div className={`flex-shrink-0 rounded-full p-2 mr-4 transition-all duration-300 ${
                ['connected', 'recording', 'processing'].includes(microphoneStatus)
                  ? 'bg-success text-white' 
                  : 'bg-gray-300 text-gray-500'
              }`}>
                <span className="material-symbols-outlined">
                  {microphoneStatus === 'recording' ? 'mic' : 'check'}
                </span>
              </div>
              <p className={`font-medium transition-all duration-300 ${
                ['connected', 'recording', 'processing'].includes(microphoneStatus)
                  ? 'text-success' 
                  : 'text-gray-500'
              }`}>
                {microphoneStatus === 'recording' ? 'Recording in progress' : 
                 microphoneStatus === 'processing' ? 'Processing audio' :
                 microphoneStatus === 'connected' ? 'Microphone ready' : 
                 'Microphone not connected'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button 
              onClick={goBack}
              className="flex-1 bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors"
            >
              Back to Languages
            </button>
            <button 
              onClick={cleanup}
              disabled={microphoneStatus === 'disconnected'}
              className="flex-1 bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-2 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              Status: {microphoneStatus} | Recording: {isRecording ? 'Yes' : 'No'} | Processing: {isProcessing ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneSetup;