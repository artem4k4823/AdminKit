import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  // Авторизация
  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/log/token-login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/log/me');
    return response.data;
  },

  // Пользователи
  async registerUser(username, password) {
    const response = await api.post('/user/create_user', {
      username,
      password
    });
    return response.data;
  },

  async getAllUsers() {
    const response = await api.get('/user/get_all_users');
    return response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/user/get_user_by_id?user_id=${userId}`);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/user/delete_user?user_id=${userId}`);
    return response.data;
  },

  // Посты
  async getAllPosts() {
    const response = await api.get('/post/get_all_posts');
    return response.data;
  },

  async createPost(title, description) {
    const response = await api.post('/post/create_post', {
      title,
      description
    });
    return response.data;
  },

  async deletePost(postId) {
    const response = await api.delete(`/post/delete-post?post_id=${postId}`);
    return response.data;
  }
};
