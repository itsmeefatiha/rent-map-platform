import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Helper function to handle errors
const handleError = (error, operation) => {
  if (error.response) {
    // Server responded with error status
    console.error(`[Properties API] ${operation} failed:`, error.response.status, error.response.data);
    throw new Error(error.response.data?.message || `Erreur serveur: ${error.response.status}`);
  } else if (error.request) {
    // Request made but no response received
    console.error(`[Properties API] ${operation} - No response from server:`, error.request);
    throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
  } else {
    // Error setting up request
    console.error(`[Properties API] ${operation} - Request setup error:`, error.message);
    throw new Error(`Erreur de connexion: ${error.message}`);
  }
};

export const propertiesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/properties`, { params });
      return response.data;
    } catch (error) {
      handleError(error, 'getAll');
      throw error;
    }
  },

  getAllForMap: async () => {
    try {
      const response = await axios.get(`${API_URL}/properties/map`);
      return response.data;
    } catch (error) {
      handleError(error, 'getAllForMap');
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/properties/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, 'getById');
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/properties`, data);
      return response.data;
    } catch (error) {
      handleError(error, 'create');
      throw error;
    }
  },

  uploadImages: async (files) => {
    try {
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
    } catch (error) {
      handleError(error, 'uploadImages');
      throw error;
    }
  },

  getMyProperties: async () => {
    try {
      const response = await axios.get(`${API_URL}/properties/my-properties`);
      return response.data;
    } catch (error) {
      handleError(error, 'getMyProperties');
      throw error;
    }
  },
};

