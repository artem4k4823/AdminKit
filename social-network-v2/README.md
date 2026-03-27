# 🌐 Социальная сеть 2.0

Современная социальная сеть с расширенным функционалом на Vue.js 3 и FastAPI.

## ✨ Новые возможности

### 🎯 Основной функционал:
- ✅ Регистрация и авторизация пользователей (JWT)
- ✅ Создание, просмотр и удаление постов
- ✅ **НОВОЕ!** Избранные посты (лайки) ❤️
- ✅ **НОВОЕ!** Личный профиль пользователя 👤
- ✅ **НОВОЕ!** Поиск пользователей по username 🔍
- ✅ **НОВОЕ!** Чат между пользователями в реальном времени 💬
- ✅ **НОВОЕ!** WebSocket для мгновенной доставки сообщений
- ✅ **НОВОЕ!** Индикация непрочитанных сообщений 🔵
- ✅ **НОВОЕ!** Активные чаты (список переписок)
- ✅ Админ-панель для управления контентом 🛡️
- ✅ Адаптивный современный дизайн 📱

## 🚀 Быстрый старт

### Требования:
- Node.js 16+ 
- npm или yarn
- FastAPI backend (запущен на http://localhost:8000)

### Установка:

1. **Установите зависимости:**
```bash
npm install
```

2. **Убедитесь, что бэкенд запущен:**
   - Бэкенд должен работать на `http://localhost:8000`
   - WebSocket должен быть доступен на `ws://localhost:8000`

3. **Настройте CORS в FastAPI:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

4. **Запустите фронтенд:**
```bash
npm run dev
```

5. **Откройте браузер:** http://localhost:5173

## 📱 Функционал по страницам

### 🏠 Главная страница (/)
**Доступ:** Только авторизованные пользователи

**Возможности:**
- Просмотр ленты всех постов
- Создание новых постов
- Добавление постов в избранное (лайки) ❤️
- Удаление своих постов
- Админы могут удалять любые посты

**API эндпоинты:**
- `GET /post/get_all_posts` - получение всех постов
- `POST /post/create_post` - создание поста
- `DELETE /post/delete-post?post_id={id}` - удаление поста
- `POST /post/add-favorite-post?post_id={id}` - добавить в избранное
- `POST /post/remove-favorite-post?post_id={id}` - убрать из избранного

### 👤 Профиль (/profile)
**Доступ:** Только авторизованные пользователи

**Возможности:**
- Просмотр информации о себе (ID, username, статус, права админа)
- Вкладка "Избранные посты" - все посты, которые вы лайкнули
- Вкладка "Мои чаты" - список всех пользователей для начала общения
- **🔍 Поиск пользователей по username** - найдите любого пользователя
- Клик по пользователю открывает чат с ним

**API эндпоинты:**
- `GET /log/me` - получение данных текущего пользователя
- `GET /post/get-favorite-posts` - получение избранных постов
- `GET /user/get_all_users` - список всех пользователей (только для админов)
- `GET /user/get_user_by_username?username={name}` - поиск по username (для всех)

### 💬 Чаты (/chat)
**Доступ:** Только авторизованные пользователи

**Возможности:**
- WebSocket соединение для real-time общения
- **🔍 Компактный поиск пользователей** в верхней части сайдбара
- Список всех пользователей в левой панели
- Выбор пользователя для начала чата
- Отправка и получение сообщений мгновенно
- История всех сообщений с каждым пользователем
- Индикатор подключения (онлайн/оффлайн)

**API эндпоинты:**
- `WebSocket /chat/ws/{user_id}` - WebSocket соединение
- `POST /chat/send-message` - отправка сообщения
- `GET /chat/history/{user1_id}/{user2_id}/` - история чата
- `PUT /chat/messages/{message_id}/read/` - пометить как прочитанное
- `GET /user/get_user_by_username?username={name}` - поиск для чата

### 🛡️ Админ-панель (/admin)
**Доступ:** Только администраторы (isAdmin = true)

**Возможности:**
- Статистика: количество постов, пользователей
- Вкладка "Посты" - просмотр и удаление любых постов
- Вкладка "Пользователи" - таблица всех пользователей
- Удаление пользователей (кроме себя)

**API эндпоинты:**
- `GET /post/get_all_posts` - все посты
- `DELETE /post/delete-post?post_id={id}` - удаление поста
- `GET /user/get_all_users` - все пользователи
- `DELETE /user/delete_user?user_id={id}` - удаление пользователя

## 🔐 Система авторизации

### JWT токены:
- Токен сохраняется в `localStorage`
- Автоматически добавляется ко всем запросам через Axios interceptor
- При истечении токена пользователь перенаправляется на страницу входа

### Защита маршрутов:
- Vue Router проверяет авторизацию перед переходом на защищенные страницы
- Админские страницы доступны только пользователям с `isAdmin = true`

## 💾 Хранилища Pinia

### Auth Store (`stores/auth.js`)
Управляет:
- Данными пользователя
- JWT токеном
- Процессом входа/выхода
- Проверкой прав админа

### Chat Store (`stores/chat.js`)
Управляет:
- WebSocket соединением
- Историей сообщений с каждым пользователем
- Текущим активным чатом
- Счетчиком непрочитанных сообщений

## 🌐 WebSocket

Приложение использует WebSocket для real-time чата:

**Подключение:**
```javascript
ws://localhost:8000/chat/ws/{user_id}
```

**Формат сообщений:**
```json
{
  "receiver_id": 2,
  "content": "Привет!"
}
```

**Автоматическое переподключение:** Если соединение разрывается, система автоматически пытается переподключиться через 3 секунды.

## 📁 Структура проекта

```
social-network-v2/
├── src/
│   ├── components/          # Vue компоненты
│   │   ├── Navbar.vue      # Навигация с индикатором непрочитанных
│   │   ├── PostCard.vue    # Карточка поста с кнопкой лайка
│   │   └── ChatWindow.vue  # Окно чата с сообщениями
│   ├── views/              # Страницы
│   │   ├── LoginView.vue   # Вход
│   │   ├── RegisterView.vue # Регистрация
│   │   ├── HomeView.vue    # Главная с постами и лайками
│   │   ├── ProfileView.vue # Профиль с избранным и чатами
│   │   ├── ChatView.vue    # Страница чатов
│   │   └── AdminView.vue   # Админ-панель
│   ├── router/
│   │   └── index.js        # Роутинг с защитой
│   ├── services/
│   │   └── api.js          # API сервис + WebSocket
│   ├── stores/             # Pinia хранилища
│   │   ├── auth.js         # Авторизация
│   │   └── chat.js         # Чаты и WebSocket
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js          # Настройки Vite + WebSocket proxy
└── README.md
```

## 🎨 Дизайн

### Цветовая схема:
- **Основной градиент:** `#667eea → #764ba2`
- **Фон:** `#f5f5f5`
- **Текст:** `#111827`
- **Акцент:** `#667eea`

### Особенности UI:
- Градиентные кнопки и заголовки
- Плавные анимации и переходы
- Hover эффекты с transform
- Адаптивная сетка (Grid + Flexbox)
- Кастомные scrollbar
- Эмодзи для визуальных акцентов

## 🔧 Настройка бэкенда

### Необходимые эндпоинты для избранного:

```python
# В posts_views.py
@router.post('/add-to-favorites')
async def add_to_favorites(
    post_id: int,
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    user, session = deps
    if post_id not in user.favorite_posts_ids:
        user.favorite_posts_ids.append(post_id)
        await session.commit()
    return {"status": "added"}

@router.delete('/remove-from-favorites')
async def remove_from_favorites(
    post_id: int,
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    user, session = deps
    if post_id in user.favorite_posts_ids:
        user.favorite_posts_ids.remove(post_id)
        await session.commit()
    return {"status": "removed"}

@router.get('/get-favorite-posts')
async def get_favorite_posts(
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    user, session = deps
    posts = await session.execute(
        select(Post).where(Post.id.in_(user.favorite_posts_ids))
    )
    return posts.scalars().all()
```

## 📊 База данных

### Модель User:
```python
class User(Base):
    id: int
    username: str
    password: str (хешированный)
    status: bool
    isAdmin: bool
    favorite_posts_ids: List[int]  # НОВОЕ ПОЛЕ!
```

### Модель Message:
```python
class Message(Base):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    is_read: bool
```

## 🐛 Решение проблем

### WebSocket не подключается:
1. Проверьте, что бэкенд запущен
2. Убедитесь в правильности URL WebSocket
3. Проверьте настройки proxy в `vite.config.js`

### Лайки не работают:
1. Убедитесь, что в модели User есть поле `favorite_posts_ids`
2. Проверьте, что эндпоинты для избранного реализованы в бэкенде
3. Запустите миграцию БД если нужно

### CORS ошибки:
```python
# В main.py бэкенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Примечания

- **Минимальная длина пароля:** 6 символов
- **WebSocket автопереподключение:** каждые 3 секунды при разрыве
- **Лайки:** хранятся в массиве `favorite_posts_ids` у каждого пользователя
- **Сообщения:** сохраняются в БД через API, отправляются через WebSocket
- **Админ права:** устанавливаются вручную в БД (`isAdmin = true`)

## 🚀 Production сборка

```bash
npm run build
```

Готовые файлы будут в папке `dist/`

## 🎯 Roadmap (возможные улучшения)

- [ ] Уведомления о новых сообщениях
- [ ] Поиск по постам и пользователям
- [ ] Загрузка изображений в посты
- [ ] Комментарии к постам
- [ ] Система подписок
- [ ] Приватность постов
- [ ] Темная тема

---

**Создано с ❤️ используя Vue.js 3 и FastAPI**

Удачи в разработке! 🚀

на хостинге данное предложение не работает конкретно в чем проблема я выдал сертификаты через certbot, настроил nginx также frontend но почему то когда я заъожу по домену socset.ddns.net у меня котрывается страница http://socset.ddns.net/login без https, а также когда я жму кнопку войти подключение к сайту пропадате хоят когда я тестирую на сервере подключение через curl всё работает пофикси
