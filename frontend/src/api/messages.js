import axios from 'axios';
import { authApi } from './auth';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const messagesAxios = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include token
messagesAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Messages API] Adding token to request:', config.url, 'Token present:', !!token);
    } else {
      console.warn('[Messages API] No token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
messagesAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('[Messages API] 403 Forbidden - Token might be invalid or expired');
      console.error('Request URL:', error.config?.url);
      console.error('Request headers:', error.config?.headers);
    }
    return Promise.reject(error);
  }
);

export const messagesApi = {
  getConversation: async (otherUserId) => {
    const response = await messagesAxios.get(`/messages/conversation/${otherUserId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await messagesAxios.get(`/messages/conversations`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await messagesAxios.put(`/messages/${id}/read`);
    return response.data;
  },

  markConversationAsRead: async (otherUserId) => {
    const response = await messagesAxios.put(`/messages/conversation/${otherUserId}/read`);
    return response.data;
  },

  sendMessage: async (receiverId, content) => {
    const response = await messagesAxios.post(`/messages/send`, {
      receiverId,
      content,
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await messagesAxios.get(`/messages/unread-count`);
    return response.data;
  },

  getUnreadCountForConversation: async (otherUserId) => {
    const response = await messagesAxios.get(`/messages/unread-count/${otherUserId}`);
    return response.data;
  },
};

