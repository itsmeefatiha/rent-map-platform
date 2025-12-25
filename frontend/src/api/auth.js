import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

let authToken = null;

export const authApi = {
  setToken: (token) => {
    authToken = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  },

  register: async (data) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/users/me`);
    return response.data;
  },
};

