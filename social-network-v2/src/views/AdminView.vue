<template>
  <div>
    <Navbar />
    
    <div class="container">
      <div class="page-header">
        <h1>⚙️ Админ-панель</h1>
        <p class="subtitle">Управление постами и пользователями</p>
      </div>
      
      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">{{ posts.length }}</div>
          <div class="stat-label">Всего постов</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ users.length }}</div>
          <div class="stat-label">Всего пользователей</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-value">{{ currentUser?.username }}</div>
          <div class="stat-label">Текущий админ</div>
        </div>
      </div>
      
      <!-- Вкладки -->
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'posts' }]"
          @click="activeTab = 'posts'"
        >
          📝 Посты
        </button>
        <button 
          :class="['tab', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          👥 Пользователи
        </button>
      </div>
      
      <!-- Посты -->
      <div v-show="activeTab === 'posts'" class="tab-content">
        <div v-if="loadingPosts" class="loading">
          <div class="spinner"></div>
          <p>Загрузка постов...</p>
        </div>
        
        <div v-else-if="postsError" class="error-message">
          {{ postsError }}
        </div>
        
        <div v-else-if="posts.length === 0" class="empty-state">
          <span class="big-icon">📭</span>
          <h3>Нет постов</h3>
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
          <div class="spinner"></div>
          <p>Загрузка пользователей...</p>
        </div>
        
        <div v-else-if="usersError" class="error-message">
          {{ usersError }}
        </div>
        
        <div v-else-if="users.length === 0" class="empty-state">
          <span class="big-icon">👥</span>
          <h3>Нет пользователей</h3>
        </div>
        
        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td><strong>{{ user.id }}</strong></td>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar-tiny">
                      <img 
                        v-if="user.avatar" 
                        :src="user.avatar" 
                        :alt="user.username"
                        class="avatar-img"
                      />
                      <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
                    </div>
                    {{ user.username }}
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', user.id === currentUser?.id ? 'current' : '']">
                    {{ user.id === currentUser?.id ? 'Вы' : 'Пользователь' }}
                  </span>
                </td>
                <td>
                  <button 
                    @click="handleDeleteUser(user.id)"
                    class="btn-delete-small"
                    :disabled="deletingUserId === user.id || user.id === currentUser?.id"
                  >
                    <span class="icon">{{ deletingUserId === user.id ? '⏳' : '🗑️' }}</span>
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
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';
import PostCard from '../components/PostCard.vue';

const authStore = useAuthStore();
const chatStore = useChatStore();

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
    
    chatStore.broadcastEvent('delete_post', { post_id: postId });
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
    
    chatStore.broadcastEvent('delete_user', { user_id: userId });
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления пользователя');
  } finally {
    deletingUserId.value = null;
  }
};

onMounted(() => {
  fetchPosts();
  fetchUsers();
  
  // Real-time обновления для админа
  chatStore.registerEventHandler('newPost', (post) => {
    posts.value = [post, ...posts.value];
  });
  
  chatStore.registerEventHandler('deletePost', (postId) => {
    posts.value = posts.value.filter(p => p.id !== postId);
  });
  
  chatStore.registerEventHandler('newUser', (user) => {
    users.value = [...users.value, user];
  });
  
  chatStore.registerEventHandler('deleteUser', (userId) => {
    users.value = users.value.filter(u => u.id !== userId);
  });
});

onUnmounted(() => {
  chatStore.registerEventHandler('newPost', null);
  chatStore.registerEventHandler('deletePost', null);
  chatStore.registerEventHandler('newUser', null);
  chatStore.registerEventHandler('deleteUser', null);
});
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #111827;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1.125rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  text-align: center;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(102, 126, 234, 0.15);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
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
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

.users-table {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-weight: 700;
  font-size: 1rem;
}

td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: background 0.3s;
}

tbody tr:hover {
  background: #f9fafb;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-tiny {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-tiny .avatar-img,
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: #e5e7eb;
  color: #374151;
}

.status-badge.current {
  background: #dbeafe;
  color: #1e40af;
}

.btn-delete-small {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete-small:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.btn-delete-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    overflow-x: auto;
  }
  
  table {
    min-width: 600px;
  }
}
</style>
