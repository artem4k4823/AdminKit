<template>
  <div class="post-card">
    <div class="post-header">
      <h3 class="post-title">{{ post.title }}</h3>
      <span class="post-author">@{{ post.user }}</span>
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
  }
});

defineEmits(['delete']);
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.post-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.post-title {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.post-author {
  color: #6b7280;
  font-size: 0.875rem;
}

.post-content {
  margin-bottom: 1rem;
}

.post-content p {
  color: #374151;
  line-height: 1.6;
}

.post-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
