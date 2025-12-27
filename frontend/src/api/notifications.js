import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const notificationsApi = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/notifications`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axios.put(`${API_URL}/notifications/${id}/read`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/notifications/unread-count`);
    return response.data;
  },
};



