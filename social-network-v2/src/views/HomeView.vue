<template>
  <div>
    <Navbar />
    
    <div class="container">
      <div class="page-header">
        <h1>🏠 Лента постов</h1>
        <p class="subtitle">Делитесь своими мыслями с миром</p>
      </div>
      
      <!-- Форма создания поста -->
      <div class="create-post-section">
        <h2>✍️ Создать новый пост</h2>
        <form @submit.prevent="handleCreatePost" class="create-post-form">
          <div class="form-group">
            <input 
              v-model="newPost.title" 
              type="text" 
              placeholder="Заголовок поста"
              required
            />
          </div>
          
          <div class="form-group">
            <textarea 
              v-model="newPost.description" 
              placeholder="Расскажите что-нибудь интересное..."
              rows="4"
              required
            ></textarea>
          </div>
          
          <div v-if="createError" class="error-message">
            {{ createError }}
          </div>
          
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="creating"
          >
            <span class="icon">{{ creating ? '⏳' : '📝' }}</span>
            {{ creating ? 'Создание...' : 'Опубликовать' }}
          </button>
        </form>
      </div>
      
      <!-- Список постов -->
      <div class="posts-section">
        <div class="section-header">
          <h2>📌 Все посты ({{ posts.length }})</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Загрузка постов...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="posts.length === 0" class="empty-state">
          <span class="big-icon">📭</span>
          <h3>Пока нет ни одного поста</h3>
          <p>Создайте первый пост и начните общение!</p>
        </div>
        
        <div v-else class="posts-grid">
          <PostCard 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
            :show-actions="canDeletePost(post)"
            :deleting="deletingPostId === post.id"
            :is-liked="isPostLiked(post.id)"
            :liking="likingPostId === post.id"
            @delete="handleDeletePost"
            @toggleLike="handleToggleLike"
          />
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

const posts = ref([]);
const favoritePosts = ref([]);
const loading = ref(false);
const error = ref('');
const creating = ref(false);
const createError = ref('');
const deletingPostId = ref(null);
const likingPostId = ref(null);

const newPost = ref({
  title: '',
  description: ''
});

const currentUser = computed(() => authStore.currentUser);

const canDeletePost = (post) => {
  return post.user === currentUser.value?.username || currentUser.value?.isAdmin;
};

const isPostLiked = (postId) => {
  return favoritePosts.value.some(fav => fav.id === postId);
};

const fetchPosts = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    posts.value = await api.getAllPosts();
  } catch (err) {
    error.value = err.response?.data?.detail || 'Ошибка загрузки постов';
  } finally {
    loading.value = false;
  }
};

const fetchFavorites = async () => {
  try {
    favoritePosts.value = await api.getFavoritePosts();
  } catch (err) {
    console.error('Ошибка загрузки избранного:', err);
  }
};

const handleCreatePost = async () => {
  creating.value = true;
  createError.value = '';
  
  try {
    await api.createPost(newPost.value.title, newPost.value.description);
    
    newPost.value.title = '';
    newPost.value.description = '';
    
    await fetchPosts();
  } catch (err) {
    createError.value = err.response?.data?.detail || 'Ошибка создания поста';
  } finally {
    creating.value = false;
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
    await fetchFavorites();
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления поста');
  } finally {
    deletingPostId.value = null;
  }
};

const handleToggleLike = async (postId) => {
  likingPostId.value = postId;
  
  try {
    if (isPostLiked(postId)) {
      await api.removeFromFavorites(postId);
    } else {
      await api.addToFavorites(postId);
    }
    await fetchFavorites();
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка при работе с избранным');
  } finally {
    likingPostId.value = null;
  }
};

onMounted(() => {
  fetchPosts();
  fetchFavorites();
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

.create-post-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.create-post-section:hover {
  border-color: #667eea;
  box-shadow: 0 8px 12px rgba(102, 126, 234, 0.15);
}

.create-post-section h2 {
  color: #111827;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group input,
.form-group textarea {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  width: 100%;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  font-size: 1.2rem;
}

.posts-section {
  margin-top: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #111827;
  font-size: 1.75rem;
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
  margin-bottom: 1rem;
  font-weight: 500;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
