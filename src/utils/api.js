import axios from 'axios';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api' 
    : 'https://personasheildai.onrender.com/api',
});

export const analyzeApi = {
  // Upload media file
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/analyze/', formData);
    return response.data;
  },

  // Get detection result by ID
  getDetectionResult: async (id) => {
    const response = await api.get(`/analyze/${id}`);
    return response.data;
  },

  // Analyze single frame (Live Shield)
  analyzeFrame: async (frameBase64, audioBase64 = null, sourceUrl = '') => {
    const response = await api.post('/analyze/frame', {
      frame: frameBase64,
      audio_data: audioBase64,
      timestamp: Date.now(),
      source_url: sourceUrl
    });
    return response.data;
  },

  // Analyze text for misinformation
  analyzeNews: async (text) => {
    const response = await api.post('/analyze/news', {
      text: text
    });
    return response.data;
  },

  // Analyze media from URL
  analyzeUrl: async (url) => {
    const response = await api.post('/analyze/url', {
      url: url,
      media_type: 'auto'
    });
    return response.data;
  },
  
  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/analyze/stats');
    return response.data;
  },
  
  // Get history
  getHistory: async (limit = 50, offset = 0) => {
    const response = await api.get(`/analyze/history?limit=${limit}&offset=${offset}`);
    return response.data;
  }
};

export default api;
