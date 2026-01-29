import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import HomeView from '../views/HomeView.vue';
import AdminView from '../views/AdminView.vue';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Если требуется авторизация
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next('/login');
    }

    // Если пользователь не загружен, загружаем
    if (!authStore.user) {
      try {
        await authStore.fetchUser();
      } catch (error) {
        return next('/login');
      }
    }

    // Проверка прав администратора
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return next('/home');
    }
  }

  // Если страница только для гостей
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/home');
  }

  next();
});

export default router;
