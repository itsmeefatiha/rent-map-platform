import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const chatbotAxios = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include token
chatbotAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatbotApi = {
  sendMessage: async (message, language = 'fr') => {
    const response = await chatbotAxios.post('/chatbot/message', {
      message,
      language,
    });
    return response.data;
  },

  getChatbotUserId: async () => {
    const response = await chatbotAxios.get('/chatbot/user-id');
    return response.data;
  },
};

