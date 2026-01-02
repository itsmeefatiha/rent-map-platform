import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Helper function to handle errors
const handleError = (error, operation) => {
  if (error.response) {
    console.error(`[Recommendations API] ${operation} failed:`, error.response.status, error.response.data);
    if (error.response.status === 403) {
      throw new Error('Accès refusé. Vous devez être connecté en tant que locataire.');
    }
    throw new Error(error.response.data?.message || `Erreur serveur: ${error.response.status}`);
  } else if (error.request) {
    console.error(`[Recommendations API] ${operation} - No response from server:`, error.request);
    throw new Error('Impossible de se connecter au serveur.');
  } else {
    console.error(`[Recommendations API] ${operation} - Request setup error:`, error.message);
    throw new Error(`Erreur de connexion: ${error.message}`);
  }
};

export const recommendationsApi = {
  getRecommendations: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/recommendations`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      handleError(error, 'getRecommendations');
      throw error;
    }
  },

  recordInteraction: async (propertyId, interactionType, searchQuery = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/recommendations/interactions`,
        null,
        {
          params: {
            propertyId,
            interactionType,
            ...(searchQuery && { searchQuery }),
          },
        }
      );
      return response.data;
    } catch (error) {
      // Ne pas faire échouer l'application si le tracking échoue
      console.warn('Failed to record interaction:', error);
    }
  },
};

