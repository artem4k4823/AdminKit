<template>
  <div>
    <Navbar />
    
    <div class="container">
      <div class="page-header">
        <h1>Все посты</h1>
      </div>
      
      <!-- Форма создания поста -->
      <div class="create-post-section">
        <h2>Создать новый пост</h2>
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
              placeholder="Описание поста"
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
            {{ creating ? 'Создание...' : 'Создать пост' }}
          </button>
        </form>
      </div>
      
      <!-- Список постов -->
      <div class="posts-section">
        <div v-if="loading" class="loading">
          Загрузка постов...
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="posts.length === 0" class="empty-state">
          Пока нет ни одного поста. Создайте первый!
        </div>
        
        <div v-else class="posts-grid">
          <PostCard 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
            :show-actions="canDeletePost(post)"
            :deleting="deletingPostId === post.id"
            @delete="handleDeletePost"
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
const loading = ref(false);
const error = ref('');
const creating = ref(false);
const createError = ref('');
const deletingPostId = ref(null);

const newPost = ref({
  title: '',
  description: ''
});

const currentUser = computed(() => authStore.currentUser);

const canDeletePost = (post) => {
  return post.user === currentUser.value?.username || currentUser.value?.isAdmin;
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

const handleCreatePost = async () => {
  creating.value = true;
  createError.value = '';
  
  try {
    await api.createPost(newPost.value.title, newPost.value.description);
    
    // Очищаем форму
    newPost.value.title = '';
    newPost.value.description = '';
    
    // Обновляем список постов
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
  } catch (err) {
    alert(err.response?.data?.detail || 'Ошибка удаления поста');
  } finally {
    deletingPostId.value = null;
  }
};

onMounted(() => {
  fetchPosts();
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
}

.create-post-section {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  width: 100%;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  align-self: flex-start;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.posts-section {
  margin-top: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.125rem;
}

.error-message {
  padding: 0.75rem;
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

@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
