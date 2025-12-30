const BASE_URL = 'http://localhost:8080/api';

export const propertyCommentsApi = {
  create: async (propertyId, commentData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create comment' }));
      throw new Error(error.message || 'Failed to create comment');
    }

    return response.json();
  },

  getByProperty: async (propertyId) => {
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/comments`);

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  },

  getAverageRating: async (propertyId) => {
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/comments/average-rating`);

    if (!response.ok) {
      throw new Error('Failed to fetch average rating');
    }

    return response.json();
  },

  toggleLike: async (propertyId, commentId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }
  },

  createReply: async (propertyId, commentId, replyData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/properties/${propertyId}/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(replyData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create reply' }));
      throw new Error(error.message || 'Failed to create reply');
    }

    return response.json();
  }
};

