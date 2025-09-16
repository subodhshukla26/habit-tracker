import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Habits API
export const habitsAPI = {
  getCategories: () => api.get('/habits/categories'),
  getHabits: (active = true) => api.get('/habits', { params: { active } }),
  getHabit: (id) => api.get(`/habits/${id}`),
  createHabit: (habitData) => api.post('/habits', habitData),
  updateHabit: (id, habitData) => api.put(`/habits/${id}`, habitData),
  deleteHabit: (id) => api.delete(`/habits/${id}`),
  checkinHabit: (id, data = {}) => api.post(`/habits/${id}/checkin`, data),
  removeCheckin: (id, date) => api.delete(`/habits/${id}/checkin`, { params: { date } }),
};

// Social API
export const socialAPI = {
  searchUsers: (query, limit = 10) => api.get('/social/users/search', { params: { q: query, limit } }),
  getFollowing: () => api.get('/social/following'),
  getFollowers: () => api.get('/social/followers'),
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/follow/${userId}`),
  getFeed: (limit = 20, offset = 0) => api.get('/social/feed', { params: { limit, offset } }),
  getLeaderboard: (period = 'week', limit = 10) => api.get('/social/leaderboard', { params: { period, limit } }),
};

export default api;
