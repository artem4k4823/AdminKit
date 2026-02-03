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
  // ==================== АВТОРИЗАЦИЯ ====================
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

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
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

  // ==================== ПОСТЫ ====================
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
  },

  // ==================== ИЗБРАННЫЕ ПОСТЫ ====================
  async addToFavorites(postId) {
    const response = await api.post(`/post/add-to-favorites?post_id=${postId}`);
    return response.data;
  },

  async removeFromFavorites(postId) {
    const response = await api.delete(`/post/remove-from-favorites?post_id=${postId}`);
    return response.data;
  },

  async getFavoritePosts() {
    const response = await api.get('/post/get-favorite-posts');
    return response.data;
  },

  // ==================== ЧАТ И СООБЩЕНИЯ ====================
  async sendMessage(receiverId, content) {
    const response = await api.post('/chat/send-message', {
      receiver_id: receiverId,
      content
    });
    return response.data;
  },

  async getChatHistory(user1Id, user2Id) {
    const response = await api.get(`/chat/history/${user1Id}/${user2Id}/`);
    return response.data;
  },

  async markMessageAsRead(messageId) {
    const response = await api.put(`/chat/messages/${messageId}/read/`);
    return response.data;
  },

  // ==================== WEBSOCKET ====================
  createWebSocket(userId) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    return new WebSocket(`${wsProtocol}//${wsHost}/ws/chat/ws/${userId}`);
  }
};
