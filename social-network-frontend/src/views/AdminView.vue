<template>
  <div>
    <Navbar />
    
    <div class="container">
      <div class="page-header">
        <h1>Админ-панель</h1>
        <p class="subtitle">Управление постами и пользователями</p>
      </div>
      
      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ posts.length }}</div>
          <div class="stat-label">Всего постов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ users.length }}</div>
          <div class="stat-label">Всего пользователей</div>
        </div>
      </div>
      
      <!-- Вкладки -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'posts' }]"
          @click="activeTab = 'posts'"
        >
          Посты
        </button>
        <button 
          :class="['tab', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          Пользователи
        </button>
      </div>
      
      <!-- Посты -->
      <div v-show="activeTab === 'posts'" class="tab-content">
        <div v-if="loadingPosts" class="loading">
          Загрузка постов...
        </div>
        
        <div v-else-if="postsError" class="error-message">
          {{ postsError }}
        </div>
        
        <div v-else-if="posts.length === 0" class="empty-state">
          Нет постов
        </div>
        
        <div v-else class="posts-grid">
          <PostCard 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
            :show-actions="true"
            :deleting="deletingPostId === post.id"
            @delete="handleDeletePost"
          />
        </div>
      </div>
      
      <!-- Пользователи -->
      <div v-show="activeTab === 'users'" class="tab-content">
        <div v-if="loadingUsers" class="loading">
          Загрузка пользователей...
        </div>
        
        <div v-else-if="usersError" class="error-message">
          {{ usersError }}
        </div>
        
        <div v-else-if="users.length === 0" class="empty-state">
          Нет пользователей
        </div>
        
        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>
                  <button 
                    @click="handleDeleteUser(user.id)"
                    class="btn-delete-small"
                    :disabled="deletingUserId === user.id || user.id === currentUser?.id"
                  >
                    {{ deletingUserId === user.id ? 'Удаление...' : 'Удалить' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';
import PostCard from '../components/PostCard.vue';

const authStore = useAuthStore();

const activeTab = ref('posts');
const posts = ref([]);
const users = ref([]);
const loadingPosts = ref(false);
const loadingUsers = ref(false);
const postsError = ref('');
const usersError = ref('');
const deletingPostId = ref(null);
const deletingUserId = ref(null);

const currentUser = computed(() => authStore.currentUser);

const fetchPosts = async () => {
  loadingPosts.value = true;
  postsError.value = '';
  
  try {
    posts.value = await api.getAllPosts();
  } catch (err) {
    postsError.value = err.response?.data?.detail || 'Ошибка загрузки постов';
  } finally {
    loadingPosts.value = false;
  }
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  usersError.value = '';
  
  try {
    users.value = await api.getAllUsers();
  } catch (err) {
    usersError.value = err.response?.data?.detail || 'Ошибка загрузки пользователей';
  } finally {
    loadingUsers.value = false;
  }
};

const handleDeletePost = async (postId) => {
  if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
    return;
  }
  
  deletingPostId.value = postId;
  
  try {
    await api.deletePost(postId);
    await fetchPosts();
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления поста');
  } finally {
    deletingPostId.value = null;
  }
};

const handleDeleteUser = async (userId) => {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
    return;
  }
  
  deletingUserId.value = userId;
  
  try {
    await api.deleteUser(userId);
    await fetchUsers();
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления пользователя');
  } finally {
    deletingUserId.value = null;
  }
};

onMounted(() => {
  fetchPosts();
  fetchUsers();
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #111827;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 1rem;
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
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab:hover {
  color: #3b82f6;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
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

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.125rem;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.users-table {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #f9fafb;
}

.btn-delete-small {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-delete-small:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    overflow-x: auto;
  }
}
</style>
