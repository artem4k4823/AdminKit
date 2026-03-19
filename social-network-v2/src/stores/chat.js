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
    unreadMessages: [],
    totalUnread: 0,
    pingInterval: null,
    // Колбэки для обработки событий
    eventHandlers: {
      newPost: null,
      deletePost: null,
      likePost: null,
      unlikePost: null,
      newUser: null,
      deleteUser: null
    }
  }),

  getters: {
    getCurrentChatMessages: (state) => {
      if (!state.currentChatUserId) return [];
      const msgs = state.messages[state.currentChatUserId] || [];
      return [...msgs];
    },
    
    isConnected: (state) => state.connected,
    
    unreadCount: (state) => state.totalUnread
  },

  actions: {
    async initWebSocket() {
      const authStore = useAuthStore();
      const userId = authStore.userId;
      
      if (!userId) {
        console.warn('⚠️ Нет userId, WebSocket не инициализирован');
        return;
      }
      
      if (this.ws && this.connected) {
        console.log('✅ WebSocket уже подключен');
        return;
      }

      try {
        console.log('🔌 Подключение WebSocket для пользователя:', userId);
        this.ws = api.createWebSocket(userId);
        
        // Промис для ожидания подключения
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
          }, 5000); // 5 секунд таймаут
          
          this.ws.onopen = () => {
            clearTimeout(timeout);
            this.connected = true;
            console.log('✅ WebSocket подключен успешно!');
            this.startPingInterval();
            resolve();
          };

          this.ws.onerror = (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket ошибка:', error);
            this.connected = false;
            reject(error);
          };
        });

        // Устанавливаем обработчики после успешного подключения
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket получено:', data);
            this.handleWebSocketEvent(data);
          } catch (err) {
            console.error('❌ Ошибка парсинга WebSocket данных:', err);
          }
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log('❌ WebSocket отключен');
          this.stopPingInterval();
          
          // Переподключение через 3 секунды
          setTimeout(() => {
            const authStore = useAuthStore();
            if (authStore.isAuthenticated) {
              console.log('🔄 Попытка переподключения...');
              this.initWebSocket();
            }
          }, 3000);
        };
        
      } catch (error) {
        console.error('❌ Ошибка инициализации WebSocket:', error);
        this.connected = false;
        throw error;
      }
    },

    startPingInterval() {
      if (this.pingInterval) return;
      
      this.pingInterval = setInterval(() => {
        if (this.ws && this.connected) {
          try {
            this.ws.send(JSON.stringify({ type: 'ping' }));
            console.log('📡 Ping отправлен');
          } catch (err) {
            console.error('❌ Ошибка отправки ping:', err);
          }
        }
      }, 30000);
    },

    stopPingInterval() {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    },

    handleWebSocketEvent(data) {
      const eventType = data.type || 'message';
      console.log(`🎯 Обработка события: ${eventType}`);
      
      switch (eventType) {
        case 'message':
        case 'chat_message':
          this.handleIncomingMessage(data);
          break;
        
        case 'new_post':
          console.log('🆕 Новый пост получен:', data.post);
          if (this.eventHandlers.newPost) {
            this.eventHandlers.newPost(data.post);
          }
          break;
        
        case 'delete_post':
          console.log('🗑️ Пост удален:', data.post_id);
          if (this.eventHandlers.deletePost) {
            this.eventHandlers.deletePost(data.post_id);
          }
          break;
        
        case 'like_post':
          console.log('❤️ Лайк:', data.post_id);
          if (this.eventHandlers.likePost) {
            this.eventHandlers.likePost(data.post_id, data.user_id);
          }
          break;
        
        case 'unlike_post':
          console.log('💔 Анлайк:', data.post_id);
          if (this.eventHandlers.unlikePost) {
            this.eventHandlers.unlikePost(data.post_id, data.user_id);
          }
          break;
        
        case 'new_user':
          console.log('👤 Новый пользователь:', data.user);
          if (this.eventHandlers.newUser) {
            this.eventHandlers.newUser(data.user);
          }
          break;
        
        case 'delete_user':
          console.log('🗑️ Пользователь удален:', data.user_id);
          if (this.eventHandlers.deleteUser) {
            this.eventHandlers.deleteUser(data.user_id);
          }
          break;
        
        case 'pong':
          console.log('📡 Pong получен');
          break;
        
        default:
          console.warn('⚠️ Неизвестный тип события:', eventType, data);
      }
    },

    registerEventHandler(eventType, handler) {
      if (this.eventHandlers.hasOwnProperty(eventType)) {
        this.eventHandlers[eventType] = handler;
        console.log(`✅ Обработчик зарегистрирован: ${eventType}`);
      } else {
        console.warn(`⚠️ Неизвестный тип события: ${eventType}`);
      }
    },

    broadcastEvent(eventType, payload) {
      if (!this.ws || !this.connected) {
        console.warn('⚠️ WebSocket не подключен, событие не отправлено:', eventType);
        return;
      }
      
      try {
        const message = {
          type: eventType,
          ...payload
        };
        this.ws.send(JSON.stringify(message));
        console.log(`📤 Событие отправлено: ${eventType}`, payload);
      } catch (err) {
        console.error('❌ Ошибка отправки события:', err);
      }
    },

    handleIncomingMessage(messageData) {
      const senderId = messageData.sender_id;
      
      const message = {
        id: messageData.id || Date.now(),
        sender_id: senderId,
        receiver_id: messageData.receiver_id || this.getCurrentUserId(),
        content: messageData.content,
        created_at: messageData.created_at || new Date().toISOString(),
        is_read: false
      };
      
      if (!this.messages[senderId]) {
        this.messages[senderId] = [];
      }
      
      const newMessages = [...this.messages[senderId], message];
      
      this.messages = {
        ...this.messages,
        [senderId]: newMessages
      };

      if (this.currentChatUserId !== senderId) {
        this.totalUnread++;
        this.unreadMessages = [...this.unreadMessages, message];
      }
      
      if (!this.activeChats.includes(senderId)) {
        this.activeChats = [senderId, ...this.activeChats];
      }
      
      console.log('✅ Сообщение добавлено:', message);
    },

    async sendMessage(receiverId, content) {
      try {
        const message = await api.sendMessage(receiverId, content);
        
        if (!this.messages[receiverId]) {
          this.messages[receiverId] = [];
        }
        
        const newMessages = [...this.messages[receiverId], message];
        
        this.messages = {
          ...this.messages,
          [receiverId]: newMessages
        };
        
        console.log('✅ Сообщение отправлено:', message);

        this.broadcastEvent('chat_message', {
          receiver_id: receiverId,
          sender_id: message.sender_id,
          content: content,
          id: message.id,
          created_at: message.created_at
        });

        return message;
      } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        throw error;
      }
    },

    async loadChatHistory(userId) {
      const authStore = useAuthStore();
      const currentUserId = authStore.userId;
      
      try {
        const messages = await api.getChatHistory(currentUserId, userId);
        this.messages = {
          ...this.messages,
          [userId]: messages
        };
        this.currentChatUserId = userId;
        
        const unreadFromUser = messages.filter(m => !m.is_read && m.sender_id === userId);
        
        for (const msg of unreadFromUser) {
          try {
            await api.markMessageAsRead(msg.id);
          } catch (err) {
            console.error('Ошибка пометки сообщения:', err);
          }
        }
        
        this.totalUnread = Math.max(0, this.totalUnread - unreadFromUser.length);
        this.unreadMessages = this.unreadMessages.filter(m => m.sender_id !== userId);
        
      } catch (error) {
        console.error('Ошибка загрузки истории чата:', error);
      }
    },

    async loadUnreadMessages() {
      try {
        const messages = await api.getUnreadMessages();
        this.unreadMessages = messages;
        this.totalUnread = messages.length;
      } catch (error) {
        console.error('Ошибка загрузки непрочитанных:', error);
      }
    },

    async loadActiveChats() {
      try {
        const users = await api.getAllMyChats();
        this.activeChats = users.map(u => u.id);
      } catch (error) {
        console.error('Ошибка загрузки активных чатов:', error);
      }
    },

    setCurrentChat(userId) {
      this.currentChatUserId = userId;
    },

    getCurrentUserId() {
      const authStore = useAuthStore();
      return authStore.userId;
    },

    closeWebSocket() {
      this.stopPingInterval();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.connected = false;
      }
    }
  }
});
