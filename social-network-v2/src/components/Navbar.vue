<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <router-link to="/home">🌐 Социальная сеть</router-link>
      </div>
      
      <div class="navbar-menu" v-if="isAuthenticated">
        <router-link to="/home" class="navbar-item">
          <span class="icon">🏠</span>
          Главная
        </router-link>
        
        <router-link to="/profile" class="navbar-item">
          <span class="icon">👤</span>
          Профиль
        </router-link>
        
        <router-link to="/chat" class="navbar-item">
          <span class="icon">💬</span>
          Чаты
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </router-link>
        
        <router-link to="/admin" class="navbar-item" v-if="isAdmin">
          <span class="icon">⚙️</span>
          Админ
        </router-link>
        
        <div class="navbar-user">
          <span class="username">{{ currentUser?.username }}</span>
          <button @click="handleLogout" class="btn-logout">Выйти</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const currentUser = computed(() => authStore.currentUser);
const unreadCount = computed(() => chatStore.unreadCount);

const handleLogout = () => {
  chatStore.closeWebSocket();
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin-bottom: 2rem;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.navbar-item {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.navbar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.navbar-item.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.icon {
  font-size: 1.2rem;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  font-weight: bold;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(30%, -30%);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.username {
  color: white;
  font-weight: 600;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

@media (max-width: 768px) {
  .navbar-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .navbar-menu {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .navbar-user {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    padding-top: 1rem;
    padding-left: 0;
    margin-left: 0;
  }
}
</style>
