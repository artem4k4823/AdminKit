<template>
  <div>
    <Navbar />
    
    <div class="container">
      <!-- Профиль пользователя -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            <img 
              v-if="currentUser?.avatar" 
              :src="currentUser.avatar" 
              :alt="currentUser.username"
              class="avatar-img"
            />
            <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="profile-info">
            <h1>{{ currentUser?.username }}</h1>
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-value">{{ currentUser?.id }}</span>
                <span class="stat-label">ID</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ currentUser?.isAdmin ? '✓' : '✗' }}</span>
                <span class="stat-label">Админ</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ currentUser?.status ? 'Активен' : 'Неактивен' }}</span>
                <span class="stat-label">Статус</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладки -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'favorites' }]"
          @click="activeTab = 'favorites'"
        >
          ❤️ Избранные посты ({{ favoritePosts.length }})
        </button>
        <button 
          :class="['tab', { active: activeTab === 'chats' }]"
          @click="activeTab = 'chats'"
        >
          💬 Мои чаты
        </button>
      </div>

      <!-- Избранные посты -->
      <div v-show="activeTab === 'favorites'" class="tab-content">
        <div v-if="loadingFavorites" class="loading">
          <div class="spinner"></div>
          <p>Загрузка избранных постов...</p>
        </div>
        
        <div v-else-if="favoritesError" class="error-message">
          {{ favoritesError }}
        </div>
        
        <div v-else-if="favoritePosts.length === 0" class="empty-state">
          <span class="big-icon">💔</span>
          <h3>Нет избранных постов</h3>
          <p>Добавляйте посты в избранное, нажимая на сердечко</p>
        </div>
        
        <div v-else class="posts-grid">
          <PostCard 
            v-for="post in favoritePosts" 
            :key="post.id"
            :post="post"
            :is-liked="true"
            :liking="likingPostId === post.id"
            @toggleLike="handleRemoveFromFavorites"
          />
        </div>
      </div>

      <!-- Список чатов -->
      <div v-show="activeTab === 'chats'" class="tab-content">
        <!-- Поиск пользователя -->
        <div class="search-section">
          <h3>🔍 Найти пользователя</h3>
          <div class="search-form">
            <input 
              v-model="searchUsername"
              type="text"
              placeholder="Введите имя пользователя..."
              @keydown.enter="handleSearch"
              class="search-input"
            />
            <button 
              @click="handleSearch" 
              :disabled="!searchUsername.trim() || searching"
              class="btn-search"
            >
              {{ searching ? '⏳' : '🔍' }} Найти
            </button>
          </div>
          
          <div v-if="searchError" class="error-message">
            {{ searchError }}
          </div>
          
          <div v-if="searchResult" class="search-result">
            <div class="user-card" @click="openChat(searchResult)">
              <div class="user-avatar">
                <img 
                  v-if="searchResult.avatar" 
                  :src="searchResult.avatar" 
                  :alt="searchResult.username"
                  class="avatar-img"
                />
                <span v-else>{{ searchResult.username.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="user-info">
                <h3>{{ searchResult.username }}</h3>
                <p class="user-id">ID: {{ searchResult.id }}</p>
              </div>
              <button class="btn-chat">
                <span class="icon">💬</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- Все пользователи -->
        <h3>👥 Все пользователи</h3>
        
        <div v-if="loadingUsers" class="loading">
          <div class="spinner"></div>
          <p>Загрузка пользователей...</p>
        </div>
        
        <div v-else-if="usersError" class="error-message">
          {{ usersError }}
        </div>
        
        <div v-else-if="otherUsers.length === 0" class="empty-state">
          <span class="big-icon">👥</span>
          <h3>Нет других пользователей</h3>
          <p>Пока в системе только вы</p>
        </div>
        
        <div v-else class="users-grid">
          <div 
            v-for="user in otherUsers" 
            :key="user.id"
            class="user-card"
            @click="openChat(user)"
          >
            <div class="user-avatar">
              <img 
                v-if="user.avatar" 
                :src="user.avatar" 
                :alt="user.username"
                class="avatar-img"
              />
              <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="user-info">
              <h3>{{ user.username }}</h3>
              <p class="user-id">ID: {{ user.id }}</p>
            </div>
            <button class="btn-chat">
              <span class="icon">💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';
import PostCard from '../components/PostCard.vue';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const activeTab = ref('favorites');
const favoritePosts = ref([]);
const allUsers = ref([]);
const loadingFavorites = ref(false);
const loadingUsers = ref(false);
const favoritesError = ref('');
const usersError = ref('');
const likingPostId = ref(null);
const searchUsername = ref('');
const searchResult = ref(null);
const searchError = ref('');
const searching = ref(false);

const currentUser = computed(() => authStore.currentUser);

const otherUsers = computed(() => {
  return allUsers.value.filter(user => user.id !== currentUser.value?.id);
});

const fetchFavoritePosts = async () => {
  loadingFavorites.value = true;
  favoritesError.value = '';
  
  try {
    favoritePosts.value = await api.getFavoritePosts();
  } catch (err) {
    favoritesError.value = err.response?.data?.detail || 'Ошибка загрузки избранных постов';
  } finally {
    loadingFavorites.value = false;
  }
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  usersError.value = '';
  
  try {
    allUsers.value = await api.getAllUsers();
  } catch (err) {
    usersError.value = err.response?.data?.detail || 'Ошибка загрузки пользователей';
  } finally {
    loadingUsers.value = false;
  }
};

const handleRemoveFromFavorites = async (postId) => {
  likingPostId.value = postId;
  
  try {
    await api.removeFromFavorites(postId);
    await fetchFavoritePosts();
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления из избранного');
  } finally {
    likingPostId.value = null;
  }
};

const openChat = (user) => {
  chatStore.setCurrentChat(user.id);
  router.push({ name: 'Chat', query: { userId: user.id, username: user.username } });
};

const handleSearch = async () => {
  if (!searchUsername.value.trim()) return;
  
  searching.value = true;
  searchError.value = '';
  searchResult.value = null;
  
  try {
    const user = await api.getUserByUsername(searchUsername.value.trim());
    
    // Проверяем что это не текущий пользователь
    if (user.id === currentUser.value?.id) {
      searchError.value = 'Это вы!';
      return;
    }
    
    searchResult.value = user;
  } catch (err) {
    searchError.value = err.response?.data?.detail || 'Пользователь не найден';
  } finally {
    searching.value = false;
  }
};

onMounted(() => {
  fetchFavoritePosts();
  fetchUsers();
});
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1.5rem;
  padding: 3rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  border: 4px solid white;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.profile-stats {
  display: flex;
  gap: 3rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 1rem 2rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab:hover {
  color: #667eea;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.big-icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: #111827;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.search-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-section h3 {
  color: #111827;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.search-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-search {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-search:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-result {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #e5e7eb, transparent);
  margin: 2rem 0;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

.users-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.user-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
}

.user-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  overflow: hidden;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  color: #111827;
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.user-id {
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-chat {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-chat:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .posts-grid,
  .users-grid {
    grid-template-columns: 1fr;
  }
}
</style>
