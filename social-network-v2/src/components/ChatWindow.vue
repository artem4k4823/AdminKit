
<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="chat-user-info">
        <div class="avatar">
            <img 
              v-if="chatUser?.avatar" 
              :src="chatUser.avatar" 
              :alt="chatUser?.displayName || chatUser?.username"
              class="avatar-img"
            />
            <span v-else>{{ (chatUser?.displayName || chatUser?.username)?.charAt(0).toUpperCase() }}</span>
          </div>
        <div>
          <h3>{{ chatUser?.displayName || chatUser?.username }}</h3>
          <span :class="['status', { online: isOnline }]">
            {{ isOnline ? 'В сети' : 'Не в сети' }}
          </span>
        </div>
      </div>
      <button @click="$emit('close')" class="btn-close">✕</button>
    </div>
    
    <div class="messages-container" ref="messagesContainer">
      <div v-if="loading" class="loading">Загрузка сообщений...</div>
      
      <div v-else-if="messages.length === 0" class="empty-chat">
        <span class="icon">💬</span>
        <p>Начните беседу!</p>
      </div>
      
      <div v-else class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', { own: message.sender_id === currentUserId }]"
        >
          <div class="message-content">
            <div class="message-text">
              <p>{{ message.content }}</p>
              <div v-if="message.sender_id === currentUserId" class="message-actions">
                <button @click="startEdit(message)" title="Редактировать" class="btn-action">✏️</button>
                <button @click="confirmDelete(message.id)" title="Удалить" class="btn-action delete">🗑️</button>
              </div>
            </div>
            <span class="message-time">{{ formatTime(message.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="message-input" :class="{ 'editing-mode': isEditing }">
      <div v-if="isEditing" class="editing-header">
        <span>✏️ Редактирование сообщения</span>
        <button @click="cancelEdit" class="btn-cancel-edit">✕</button>
      </div>
      <div class="input-wrapper">
        <textarea
          v-model="newMessage"
          @keydown.enter.prevent="handleSendMessage"
          :placeholder="isEditing ? 'Измените сообщение...' : 'Введите сообщение... (Enter для отправки)'"
          rows="2"
          minlength="1"
          maxlength="500"
        ></textarea>
        <button 
          @click="handleSendMessage" 
          :disabled="!newMessage.trim() || sending"
          class="btn-send"
          :title="isEditing ? 'Сохранить изменения' : 'Отправить'"
        >
          <span class="icon">{{ sending ? '⏳' : (isEditing ? '✅' : '📤') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, watchEffect } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

const props = defineProps({
  chatUser: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const chatStore = useChatStore();

const newMessage = ref('');
const sending = ref(false);
const loading = ref(false);
const messagesContainer = ref(null);
const editingMessageId = ref(null);

const currentUserId = computed(() => authStore.userId);
const messages = computed(() => chatStore.getCurrentChatMessages);
const isOnline = computed(() => chatStore.isConnected);
const isEditing = computed(() => editingMessageId.value !== null);

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ru-RU');
};

const startEdit = (message) => {
  editingMessageId.value = message.id;
  newMessage.value = message.content;
};

const cancelEdit = () => {
  editingMessageId.value = null;
  newMessage.value = '';
};

const confirmDelete = async (messageId) => {
  if (confirm('Вы уверены, что хотите удалить это сообщение?')) {
    try {
      await chatStore.deleteMessage(messageId);
    } catch (error) {
      alert('Ошибка при удалении сообщения');
    }
  }
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return;
  
  sending.value = true;
  const content = newMessage.value.trim();
  
  try {
    if (isEditing.value) {
      await chatStore.editMessage(editingMessageId.value, content);
      cancelEdit();
    } else {
      newMessage.value = '';
      await chatStore.sendMessage(props.chatUser.id, content);
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    if (!isEditing.value) {
      newMessage.value = content;
    }
  } finally {
    sending.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(() => props.chatUser, async (newUser) => {
  if (newUser) {
    loading.value = true;
    await chatStore.loadChatHistory(newUser.id);
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}, { immediate: true });

// Реактивно следим за изменениями в сообщениях
watch(
  () => chatStore.getCurrentChatMessages,
  async (newMessages) => {
    console.log('🔄 Сообщения обновились, всего:', newMessages.length);
    await nextTick();
    scrollToBottom();
  },
  { deep: true, immediate: false }
);

// Дополнительный watch на изменение длины массива
watch(
  () => messages.value.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength) {
      console.log('📨 Новое сообщение! Было:', oldLength, 'Стало:', newLength);
      await nextTick();
      scrollToBottom();
    }
  }
);

// WatchEffect - автоматически отслеживает все реактивные зависимости
watchEffect(() => {
  const msgCount = messages.value.length;
  if (msgCount > 0) {
    // Используем небольшую задержку чтобы DOM успел обновиться
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }
});
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-user-info h3 {
  margin: 0;
  font-size: 1.25rem;
}

.status {
  font-size: 0.875rem;
  opacity: 0.9;
}

.status.online {
  color: #4ade80;
  font-weight: 600;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.loading,
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  gap: 1rem;
}

.empty-chat .icon {
  font-size: 4rem;
  opacity: 0.3;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
}

.message.own {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 1rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-text {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.message-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-action:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.message.own .btn-action:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-action.delete:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

.message.own .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.message:not(.own) .message-content {
  border-bottom-left-radius: 0.25rem;
}

.message-content p {
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  flex: 1;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  .message-actions {
    opacity: 1; /* Всегда показывать на мобильных */
  }
}

.message-input {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.message-input.editing-mode {
  background-color: #fefce8;
}

.editing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px dashed #facc15;
  font-size: 0.875rem;
  color: #a16207;
}

.btn-cancel-edit {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
}

.message-input textarea {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  transition: all 0.3s;
}

.message-input textarea:focus {
  outline: none;
  border-color: #667eea;
}

.btn-send {
  padding: 1rem 1.5rem;
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

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
