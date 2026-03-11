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
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
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

.btn-like {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.btn-like:hover:not(:disabled) {
  transform: scale(1.2);
}

.btn-like:disabled {
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
</style>
