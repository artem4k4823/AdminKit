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
              <div class="user-avatar-small">{{ user.username.charAt(0).toUpperCase() }}</div>
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

const currentUser = computed(() => authStore.currentUser);
const isConnected = computed(() => chatStore.isConnected);

const otherUsers = computed(() => {
  return allUsers.value.filter(user => user.id !== currentUser.value?.id);
});

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
};

onMounted(() => {
  fetchUsers();
  
  // Инициализируем WebSocket если ещё не подключен
  if (!chatStore.isConnected) {
    chatStore.initWebSocket();
  }
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
