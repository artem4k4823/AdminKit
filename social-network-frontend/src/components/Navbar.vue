<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <router-link to="/home">Социальная сеть</router-link>
      </div>
      
      <div class="navbar-menu" v-if="isAuthenticated">
        <router-link to="/home" class="navbar-item">Главная</router-link>
        <router-link to="/admin" class="navbar-item" v-if="isAdmin">Админ-панель</router-link>
        
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

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const currentUser = computed(() => authStore.currentUser);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin-bottom: 2rem;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.navbar-item {
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.navbar-item:hover {
  color: #3b82f6;
}

.navbar-item.router-link-active {
  color: #3b82f6;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid #e5e7eb;
}

.username {
  color: #6b7280;
  font-weight: 500;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #dc2626;
}
</style>
