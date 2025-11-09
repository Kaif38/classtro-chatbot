import axios from 'axios';

const BASE_URL = 'https://classtro-chatbot.onrender.com/api';  // Changed to 5001

export const authAPI = axios.create({
  baseURL: BASE_URL,
});

export const chatAPI = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests
chatAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
