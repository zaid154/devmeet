import axios from 'axios';
import { BASE_URL, SOCKET_URL } from '../utils/constants';

// Centralized Axios Instance with credentials & base URL pre-configured
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data
    };
    return Promise.reject(customError);
  }
);

export { BASE_URL, SOCKET_URL };
export default api;
