import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('axcp-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('axcp-refresh');
      if (refreshToken && error.config?.url !== '/auth/login') {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('axcp-token', data.data.token);
          error.config.headers.Authorization = `Bearer ${data.data.token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('axcp-token');
          localStorage.removeItem('axcp-refresh');
          localStorage.removeItem('axcp-user');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
