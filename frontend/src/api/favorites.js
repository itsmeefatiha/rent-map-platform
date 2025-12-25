import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const favoritesApi = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/favorites`);
    return response.data;
  },

  add: async (propertyId) => {
    const response = await axios.post(`${API_URL}/favorites/${propertyId}`);
    return response.data;
  },

  remove: async (propertyId) => {
    const response = await axios.delete(`${API_URL}/favorites/${propertyId}`);
    return response.data;
  },

  check: async (propertyId) => {
    const response = await axios.get(`${API_URL}/favorites/${propertyId}/check`);
    return response.data;
  },
};

