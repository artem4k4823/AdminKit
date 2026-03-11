<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Регистрация</h1>
        <p class="auth-subtitle">Создайте свой аккаунт</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username">Логин (Уникальный)</label>
          <input 
            id="username"
            v-model="username" 
            type="text" 
            required
            placeholder="Введите логин"
          />
        </div>
        
        <div class="form-group">
          <label for="displayName">Отображаемое имя</label>
          <input 
            id="displayName"
            v-model="displayName" 
            type="text" 
            required
            placeholder="Как вас будут видеть"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Пароль</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required
            placeholder="Введите пароль"
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            required
            placeholder="Повторите пароль"
          />
        </div>
        
        <div class="form-group">
          <label>Аватар (необязательно)</label>
          <div class="avatar-upload-container">
            <div class="avatar-preview" @click="triggerFileInput">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" />
              <span v-else class="avatar-placeholder">📸</span>
            </div>
            <input 
              ref="fileInput"
              type="file" 
              accept="image/*" 
              @change="handleAvatarChange" 
              class="hidden-file-input"
            />
            <button type="button" class="btn-secondary" @click="triggerFileInput">
              Выбрать фото
            </button>
            <button 
              v-if="avatarFile" 
              type="button" 
              class="btn-text-danger" 
              @click="clearAvatar"
            >
              Удалить
            </button>
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-if="success" class="success-message">
          {{ success }}
        </div>
        
        <button 
          type="submit" 
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>
      
      <div class="auth-footer">
        <p>Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const username = ref('');
const displayName = ref('');
const password = ref('');
const confirmPassword = ref('');
const avatarFile = ref(null);
const avatarPreview = ref(null);
const fileInput = ref(null);
const error = ref('');
const success = ref('');
const loading = ref(false);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      error.value = 'Размер файла не должен превышать 5МБ';
      return;
    }
    
    avatarFile.value = file;
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
    error.value = '';
  }
};

const clearAvatar = () => {
  avatarFile.value = null;
  avatarPreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleRegister = async () => {
  error.value = '';
  success.value = '';
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают';
    return;
  }
  
  if (password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }
  
  loading.value = true;
  
  try {
    await authStore.register(username.value, displayName.value, password.value, avatarFile.value);
    success.value = 'Регистрация успешна! Перенаправление на страницу входа...';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err) {
    error.value = err.response?.data?.detail || 'Ошибка регистрации';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 1.5rem;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  color: #111827;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.avatar-upload-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
  flex-shrink: 0;
}

.avatar-preview:hover {
  border-color: #667eea;
  background: #eef2ff;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 1.5rem;
  color: #9ca3af;
}

.hidden-file-input {
  display: none;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-text-danger {
  padding: 0.5rem;
  background: transparent;
  color: #ef4444;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-text-danger:hover {
  text-decoration: underline;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.success-message {
  padding: 1rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-primary {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  color: #6b7280;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
