import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const reviewsApi = {
  create: async (ownerId, data) => {
    const response = await axios.post(`${API_URL}/reviews/owner/${ownerId}`, data);
    return response.data;
  },

  getByOwner: async (ownerId) => {
    const response = await axios.get(`${API_URL}/reviews/owner/${ownerId}`);
    return response.data;
  },
};



