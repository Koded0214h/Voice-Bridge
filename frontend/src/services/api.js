import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const announcementAPI = {
  // Create announcement from text
  createFromText: async (text, languages, tone = 'neutral') => {
    const response = await api.post('/announce/', {
      text,
      languages,
      tone
    });
    return response.data;
  },

  // Transcribe audio and create announcement
  transcribeAudio: async (audioFile, languages, tone = 'neutral') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('languages', JSON.stringify(languages));
    formData.append('tone', tone);

    const response = await api.post('/transcribe/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get announcement history
  getHistory: async () => {
    const response = await api.get('/history/');
    return response.data;
  }
};

export default api;