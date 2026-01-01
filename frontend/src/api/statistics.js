import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Helper function to handle errors
const handleError = (error, operation) => {
  if (error.response) {
    console.error(`[Statistics API] ${operation} failed:`, error.response.status, error.response.data);
    throw new Error(error.response.data?.message || `Erreur serveur: ${error.response.status}`);
  } else if (error.request) {
    console.error(`[Statistics API] ${operation} - No response from server:`, error.request);
    throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
  } else {
    console.error(`[Statistics API] ${operation} - Request setup error:`, error.message);
    throw new Error(`Erreur de connexion: ${error.message}`);
  }
};

export const statisticsApi = {
  getStatistics: async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics`);
      return response.data;
    } catch (error) {
      handleError(error, 'getStatistics');
      throw error;
    }
  },
};

