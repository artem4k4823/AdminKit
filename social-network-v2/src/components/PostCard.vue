<template>
  <div class="post-card">
    <div class="post-header">
      <div class="author-info">
        <div class="avatar-small">
          <img v-if="post.user_avatar" :src="post.user_avatar" class="avatar-img" />
          <span v-else>{{ (post.user_display_name || post.user)?.charAt(0).toUpperCase() }}</span>
        </div>
        <div>
          <h3 class="post-title">{{ post.title }}</h3>
          <span class="post-author">{{ post.user_display_name || post.user }} <small>@{{ post.user }}</small></span>
        </div>
      </div>
      <div class="post-actions">
        <button 
          @click="$emit('toggleLike', post.id)" 
          :class="['btn-like', { liked: isLiked }]"
          :disabled="liking"
          title="Добавить в избранное"
        >
          <span class="heart">{{ isLiked ? '❤️' : '🤍' }}</span>
        </button>
        <button 
          @click="toggleComments" 
          class="btn-comment"
          title="Комментарии"
        >
          <span class="icon">💬</span>
        </button>
      </div>
    </div>
    
    <div class="post-content">
      <p>{{ post.description }}</p>
    </div>
    
    <div class="post-footer" v-if="showActions">
      <button 
        @click="$emit('delete', post.id)" 
        class="btn-delete"
        :disabled="deleting"
      >
        <span class="icon">🗑️</span>
        {{ deleting ? 'Удаление...' : 'Удалить' }}
      </button>
    </div>

    <!-- Комментарии -->
    <div v-if="showComments" class="comments-section">
      <h4>Комментарии</h4>
      
      <div v-if="loadingComments" class="loading-text">Загрузка...</div>
      
      <div v-else class="comments-list">
        <div v-if="comments.length === 0" class="no-comments">Пока нет комментариев.</div>
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <strong>{{ comment.user }}</strong>: <span>{{ comment.content }}</span>
        </div>
      </div>
      
      <form @submit.prevent="handleCreateComment" class="comment-form">
        <input 
          v-model="newCommentText" 
          type="text" 
          placeholder="Написать комментарий..."
          :disabled="submittingComment"
          required
        />
        <button type="submit" :disabled="submittingComment || !newCommentText.trim()" class="btn-submit-comment">
          Отправить
        </button>
      </form>
    </div>

  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import api from '../services/api';

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  deleting: {
    type: Boolean,
    default: false
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  liking: {
    type: Boolean,
    default: false
  }
});

defineEmits(['delete', 'toggleLike']);

const showComments = ref(false);
const comments = ref([]);
const loadingComments = ref(false);
const newCommentText = ref('');
const submittingComment = ref(false);

const toggleComments = async () => {
  showComments.value = !showComments.value;
  if (showComments.value && comments.value.length === 0) {
    await fetchComments();
  }
};

const fetchComments = async () => {
  loadingComments.value = true;
  try {
    comments.value = await api.getComments(props.post.id);
  } catch (err) {
    console.error('Ошибка загрузки комментариев:', err);
  } finally {
    loadingComments.value = false;
  }
};

const handleCreateComment = async () => {
  if (!newCommentText.value.trim()) return;
  submittingComment.value = true;
  try {
    const newComment = await api.createComment(props.post.id, newCommentText.value);
    comments.value.push(newComment);
    newCommentText.value = '';
  } catch (err) {
    console.error('Ошибка создания комментария:', err);
  } finally {
    submittingComment.value = false;
  }
};
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.post-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.post-title {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  word-break: break-word;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-small {
  width: 40px;
  height: 40px;
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

.avatar-small .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-author {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
}

.post-author small {
  opacity: 0.7;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-like, .btn-comment {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.btn-like:hover:not(:disabled), .btn-comment:hover:not(:disabled) {
  transform: scale(1.2);
}

.btn-like:disabled, .btn-comment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-like.liked .heart {
  animation: heartbeat 0.3s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.post-content {
  margin-bottom: 1rem;
}

.post-content p {
  color: #374151;
  line-height: 1.7;
  font-size: 1rem;
  word-break: break-word;
  white-space: pre-wrap;
}

.post-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  font-size: 1rem;
}

.comments-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.comments-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #374151;
}

.loading-text, .no-comments {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.comments-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-item {
  background: #f9fafb;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  word-break: break-word;
}

.comment-item strong {
  color: #111827;
  margin-right: 0.25rem;
}

.comment-form {
  display: flex;
  gap: 0.5rem;
}

.comment-form input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.comment-form input:focus {
  border-color: #667eea;
}

.btn-submit-comment {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-submit-comment:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-submit-comment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
