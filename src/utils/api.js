import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

  // Analyze a single frame (base64)
  analyzeFrame: async (base64Frame) => {
    const response = await api.post('/analyze/frame', {
      frame: base64Frame,
      timestamp: Date.now()
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
