import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
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
  async registerUser(username, displayName, password, avatarFile = null) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('displayName', displayName);
    formData.append('password', password);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const response = await api.post('/user/create_user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async getAllUsers() {
    const response = await api.get('/user/get_all_users');
    return response.data;
  },

  async updateProfile(username, displayName, avatarFile = null) {
    const formData = new FormData();
    if (username) formData.append('username', username);
    if (displayName) formData.append('displayName', displayName);
    if (avatarFile) formData.append('avatar', avatarFile);

    const response = await api.patch('/log/me/settings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/user/get_user_by_id?user_id=${userId}`);
    return response.data;
  },

  async getUserByUsername(username) {
    const response = await api.get(`/user/get_user_by_username?username=${username}`);
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

  // ==================== КОММЕНТАРИИ ====================
  async getComments(postId) {
    const response = await api.get(`/${postId}/comment/get_all_comments`);
    return response.data;
  },

  async createComment(postId, content) {
    const response = await api.post(`/${postId}/comment/create`, {
      content
    });
    return response.data;
  },

  // ==================== ИЗБРАННЫЕ ПОСТЫ ====================
  async addToFavorites(postId) {
    const response = await api.post(`/post/add-favorite-post?post_id=${postId}`);
    return response.data;
  },

  async removeFromFavorites(postId) {
    const response = await api.post(`/post/remove-favorite-post?post_id=${postId}`);
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

  // ==================== НОВЫЕ ЭНДПОИНТЫ ====================

  async getUnreadMessages() {
    const response = await api.get('/chat/unread/me/');
    return response.data;
  },

  async getAllMyChats() {
    const response = await api.get('/chat/all-your-chats');
    return response.data;
  },

  async deleteMessage(messageId) {
    const response = await api.delete(`/chat/messages/${messageId}/delete`);
    return response.data;
  },

  async editMessage(messageId, content) {
    const response = await api.patch(`/chat/messages/${messageId}/edit`, {
      content
    });
    return response.data;
  },

  // ==================== WEBSOCKET ====================
  createWebSocket(userId) {
    let wsUrl;
    if (import.meta.env.VITE_WS_URL) {
      wsUrl = `${import.meta.env.VITE_WS_URL}/${userId}`;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${window.location.hostname}:8000/chat/ws/${userId}`;
    }
    console.log('🔌 Создаем WebSocket соединение:', wsUrl);
    return new WebSocket(wsUrl);
  }
};
