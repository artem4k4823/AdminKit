<template>
  <div>
    <Navbar />
    
    <div class="container">
      <div class="chat-layout">
        <!-- Список пользователей -->
        <div class="users-sidebar">
          <div class="sidebar-header">
            <h2>💬 Чаты</h2>
            <span class="connection-status" :class="{ online: isConnected }">
              {{ isConnected ? '🟢 Онлайн' : '🔴 Оффлайн' }}
            </span>
          </div>
          
          <!-- Поиск -->
          <div class="search-box">
            <input 
              v-model="searchUsername"
              type="text"
              placeholder="Поиск по имени..."
              @keydown.enter="handleSearch"
              class="search-input-small"
            />
            <button 
              @click="handleSearch" 
              :disabled="!searchUsername.trim() || searching"
              class="btn-search-small"
            >
              {{ searching ? '⏳' : '🔍' }}
            </button>
          </div>
          
          <div v-if="searchError" class="error-small">
            {{ searchError }}
          </div>
          
          <div v-if="searchResult" class="search-result-box">
            <div 
              :class="['user-item', { active: selectedUser?.id === searchResult.id }]"
              @click="selectUser(searchResult)"
            >
              <div class="user-avatar-small">
                <img 
                  v-if="searchResult.avatar" 
                  :src="searchResult.avatar" 
                  :alt="searchResult.username"
                  class="avatar-img"
                />
                <span v-else>{{ searchResult.username.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="user-details">
                <h4>{{ searchResult.username }}</h4>
                <p class="user-id-small">Найден</p>
              </div>
            </div>
            <div class="divider-small"></div>
          </div>
          
          <!-- Активные чаты -->
          <div v-if="activeChatsUsers.length > 0" class="active-chats-section">
            <div class="section-label">Активные чаты ({{ activeChatsUsers.length }})</div>
            <div 
              v-for="user in activeChatsUsers" 
              :key="user.id"
              :class="['user-item', { active: selectedUser?.id === user.id }]"
              @click="selectUser(user)"
            >
              <div class="user-avatar-small">
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  :alt="user.username"
                  class="avatar-img"
                />
                <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="user-details">
                <h4>{{ user.username }}</h4>
                <p class="user-id-small">ID: {{ user.id }}</p>
              </div>
              <span v-if="hasUnreadFrom(user.id)" class="unread-indicator">●</span>
            </div>
            <div class="divider-small"></div>
          </div>
          
          <div v-if="loadingUsers" class="loading-sidebar">
            <div class="spinner-small"></div>
            <p>Загрузка...</p>
          </div>
          
          <div v-else-if="otherUsers.length === 0" class="empty-sidebar">
            <p>Нет пользователей</p>
          </div>
          
          <div v-else class="users-list">
            <div 
              v-for="user in otherUsers" 
              :key="user.id"
              :class="['user-item', { active: selectedUser?.id === user.id }]"
              @click="selectUser(user)"
            >
              <div class="user-avatar-small">
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  :alt="user.username"
                  class="avatar-img"
                />
                <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="user-details">
                <h4>{{ user.username }}</h4>
                <p class="user-id-small">ID: {{ user.id }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Окно чата -->
        <div class="chat-main">
          <div v-if="!selectedUser" class="chat-empty">
            <span class="big-icon">💬</span>
            <h2>Выберите пользователя</h2>
            <p>Начните общение, выбрав пользователя из списка слева</p>
          </div>
          
          <ChatWindow 
            v-else
            :chatUser="selectedUser"
            @close="selectedUser = null"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';
import ChatWindow from '../components/ChatWindow.vue';

const route = useRoute();
const authStore = useAuthStore();
const chatStore = useChatStore();

const allUsers = ref([]);
const selectedUser = ref(null);
const loadingUsers = ref(false);
const searchUsername = ref('');
const searchResult = ref(null);
const searchError = ref('');
const searching = ref(false);

const currentUser = computed(() => authStore.currentUser);
const isConnected = computed(() => chatStore.isConnected);

const otherUsers = computed(() => {
  return allUsers.value.filter(user => user.id !== currentUser.value?.id);
});

const activeChatsUsers = computed(() => {
  const activeIds = chatStore.activeChats;
  return allUsers.value.filter(user => 
    activeIds.includes(user.id) && user.id !== currentUser.value?.id
  );
});

const hasUnreadFrom = (userId) => {
  return chatStore.unreadMessages.some(msg => msg.sender_id === userId);
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  
  try {
    allUsers.value = await api.getAllUsers();
    
    // Если в URL есть параметр userId, открываем этот чат
    if (route.query.userId) {
      const userId = parseInt(route.query.userId);
      const user = allUsers.value.find(u => u.id === userId);
      if (user) {
        selectedUser.value = user;
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err);
  } finally {
    loadingUsers.value = false;
  }
};

const selectUser = (user) => {
  selectedUser.value = user;
  searchResult.value = null;
  searchUsername.value = '';
  searchError.value = '';
};

const handleSearch = async () => {
  if (!searchUsername.value.trim()) return;
  
  searching.value = true;
  searchError.value = '';
  searchResult.value = null;
  
  try {
    const user = await api.getUserByUsername(searchUsername.value.trim());
    
    if (user.id === currentUser.value?.id) {
      searchError.value = 'Это вы!';
      return;
    }
    
    searchResult.value = user;
  } catch (err) {
    searchError.value = 'Не найден';
  } finally {
    searching.value = false;
  }
};

onMounted(async () => {
  await fetchUsers();
  
  // Инициализируем WebSocket если ещё не подключен
  if (!chatStore.isConnected) {
    await chatStore.initWebSocket();
  }
  
  // Загружаем активные чаты и непрочитанные сообщения
  await chatStore.loadActiveChats();
  await chatStore.loadUnreadMessages();
});
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.chat-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  height: 600px;
}

.users-sidebar {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-status.online {
  background: rgba(74, 222, 128, 0.3);
}

.search-box {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
}

.search-input-small {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.search-input-small:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search-small {
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-search-small:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-search-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-small {
  padding: 0.5rem 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-result-box {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 100px;
  }
}

.divider-small {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

.active-chats-section {
  border-bottom: 2px solid #e5e7eb;
}

.section-label {
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.unread-indicator {
  color: #3b82f6;
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-sidebar,
.empty-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  flex: 1;
  color: #6b7280;
}

.spinner-small {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.users-list {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.user-item:hover {
  background: #f9fafb;
}

.user-item.active {
  background: #f0f4ff;
  border-left-color: #667eea;
}

.user-avatar-small {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.125rem;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-small .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-details h4 {
  margin: 0 0 0.25rem 0;
  color: #111827;
  font-size: 1rem;
}

.user-id-small {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.chat-main {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-empty {
  text-align: center;
  color: #6b7280;
}

.big-icon {
  font-size: 6rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.chat-empty h2 {
  color: #111827;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.chat-empty p {
  font-size: 1.125rem;
}

@media (max-width: 1024px) {
  .chat-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .users-sidebar {
    height: 300px;
  }
  
  .chat-main {
    min-height: 600px;
  }
}
</style>
