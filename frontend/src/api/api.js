import axios from 'axios';

import { API_BASE } from '../constants/Config';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    register: (userData) => api.post('/api/v1/auth/register', userData),
    login: (credentials) => api.post('/api/v1/auth/login', credentials),
    getProfile: (userId) => api.get(`/api/v1/users/profile?user_id=${userId}`),
    forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
    editProfile: (userId, profileData) => api.post(`/api/v1/users/profile?user_id=${userId}`, profileData),
};

export default api;
