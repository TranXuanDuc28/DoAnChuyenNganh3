import axios from 'axios';

// THAY ĐỔI IP NÀY THÀNH IP MÁY TÍNH CỦA BẠN NẾU CHẠY TRÊN ĐIỆN THOẠI THẬT
const API_BASE_URL = 'http://192.168.1.42:8001';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    register: (userData) => api.post('/register', userData),
    login: (credentials) => api.post('/login', credentials),
    getProfile: (userId) => api.get(`/get-profile?user_id=${userId}`),
    forgotPassword: (email) => api.post('/forgot-password', { email }),
    editProfile: (userId, profileData) => api.post(`/edit-profile?user_id=${userId}`, profileData),
};

export default api;
