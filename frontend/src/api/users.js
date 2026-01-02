import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const usersApi = {
  updateOwner: async (data) => {
    const response = await axios.put(`${API_URL}/users/owner`, data);
    return response.data;
  },

  updateTenant: async (data) => {
    const response = await axios.put(`${API_URL}/users/tenant`, data);
    return response.data;
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/users/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/users/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

