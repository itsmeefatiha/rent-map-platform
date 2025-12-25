import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const propertiesApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_URL}/properties`, { params });
    return response.data;
  },

  getAllForMap: async () => {
    const response = await axios.get(`${API_URL}/properties/map`);
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`${API_URL}/properties/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post(`${API_URL}/properties`, data);
    return response.data;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await axios.post(`${API_URL}/properties/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyProperties: async () => {
    const response = await axios.get(`${API_URL}/properties/my-properties`);
    return response.data;
  },
};

