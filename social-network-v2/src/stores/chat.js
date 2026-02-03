import { defineStore } from 'pinia';
import api from '../services/api';
import { useAuthStore } from './auth';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: {},
    activeChats: [],
    currentChatUserId: null,
    ws: null,
    connected: false,
    unreadCount: 0
  }),

  getters: {
    getCurrentChatMessages: (state) => {
      return state.currentChatUserId ? state.messages[state.currentChatUserId] || [] : [];
    },
    
    isConnected: (state) => state.connected
  },

  actions: {
    async initWebSocket() {
      const authStore = useAuthStore();
      const userId = authStore.userId;
      
      if (!userId || this.ws) return;

      try {
        this.ws = api.createWebSocket(userId);
        
        this.ws.onopen = () => {
          this.connected = true;
          console.log('WebSocket подключен');
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log('WebSocket отключен');
          // Переподключение через 3 секунды
          setTimeout(() => {
            this.initWebSocket();
          }, 3000);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
        };
      } catch (error) {
        console.error('Ошибка инициализации WebSocket:', error);
      }
    },

    handleIncomingMessage(message) {
      const senderId = message.sender_id;
      
      if (!this.messages[senderId]) {
        this.messages[senderId] = [];
      }
      
      this.messages[senderId].push({
        id: Date.now(),
        sender_id: senderId,
        content: message.content,
        created_at: new Date().toISOString(),
        is_read: false
      });

      // Если это не текущий чат, увеличиваем счетчик непрочитанных
      if (this.currentChatUserId !== senderId) {
        this.unreadCount++;
      }
    },

    async sendMessage(receiverId, content) {
      const authStore = useAuthStore();
      
      try {
        // Сохраняем в БД через API
        const message = await api.sendMessage(receiverId, content);
        
        // Добавляем в локальное хранилище
        if (!this.messages[receiverId]) {
          this.messages[receiverId] = [];
        }
        
        this.messages[receiverId].push(message);

        // Отправляем через WebSocket
        if (this.ws && this.connected) {
          this.ws.send(JSON.stringify({
            receiver_id: receiverId,
            content: content
          }));
        }

        return message;
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        throw error;
      }
    },

    async loadChatHistory(userId) {
      const authStore = useAuthStore();
      const currentUserId = authStore.userId;
      
      try {
        const messages = await api.getChatHistory(currentUserId, userId);
        this.messages[userId] = messages;
        this.currentChatUserId = userId;
        
        // Сбрасываем счетчик непрочитанных для этого чата
        this.unreadCount = Math.max(0, this.unreadCount - messages.filter(m => !m.is_read && m.sender_id === userId).length);
      } catch (error) {
        console.error('Ошибка загрузки истории чата:', error);
      }
    },

    setCurrentChat(userId) {
      this.currentChatUserId = userId;
    },

    closeWebSocket() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.connected = false;
      }
    }
  }
});
