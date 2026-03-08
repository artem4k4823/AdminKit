# 🔧 Дополнение бэкенда для полной работы фронтенда

## ⚠️ Важно!

Для полноценной работы фронтенда ваш бэкенд должен иметь следующие эндпоинты.

## ✅ Эндпоинты для избранного (уже реализованы!)

Отлично! В вашем `posts_views.py` уже есть все необходимые эндпоинты:

```python
# ✅ Уже есть в вашем коде!
@router.post('/add-favorite-post')
async def add_favorite_post(post_id: int, deps: Tuple[User,AsyncSession] = Depends(get_current_user)):
    user, session = deps
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    if post_id not in user.favorite_posts_ids:
        user.favorite_posts_ids.append(post_id)
        await session.commit()
        return {"status": "added", "post_id": post_id}
    return {"status": "already_added", "post_id": post_id}

@router.post('/remove-favorite-post')
async def remove_favorite_post(post_id: int, deps: Tuple[User,AsyncSession] = Depends(get_current_user)):
    user, session = deps
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    if post_id in user.favorite_posts_ids:
        user.favorite_posts_ids.remove(post_id)
        await session.commit()
        return {"status": "removed", "post_id": post_id}
    return {"status": "not_found"}

@router.get('/get-favorite-posts')
async def get_favorite_posts(deps: Tuple[User, AsyncSession] = Depends(get_current_user)):
    user, session = deps
    if not user.favorite_posts_ids:
        return []
    result = await session.execute(
        select(Post).where(Post.id.in_(user.favorite_posts_ids))
    )
    posts = result.scalars().all()
    return posts
```

## 📝 Небольшое исправление

В вашем коде есть опечатка - вторая функция называется `add_favorite_post`, но должна быть `remove_favorite_post`:

```python
# БЫЛО (с ошибкой):
@router.post('/remove-favorite-post')
async def add_favorite_post(post_id: int, ...):  # ❌ Неправильное имя функции
    ...

# ДОЛЖНО БЫТЬ:
@router.post('/remove-favorite-post')
async def remove_favorite_post(post_id: int, ...):  # ✅ Правильное имя
    ...
```

Это не критично (Python использует имя из декоратора), но для чистоты кода лучше исправить.

## 🗄️ Обновление модели User

Убедитесь, что в вашей модели `User` (файл `users.py`) есть поля `favorite_posts_ids` и `chats`:

```python
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(nullable=False, unique=True)
    password: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[bool] = mapped_column(default=True)
    isAdmin: Mapped[bool] = mapped_column(default=False)
    
    # Избранные посты
    favorite_posts_ids: Mapped[Optional[List[int]]] = mapped_column(
        MutableList.as_mutable(JSONB),
        default=list,
        nullable=True
    )
    
    # НОВОЕ! Активные чаты (ID пользователей)
    chats: Mapped[Optional[List[int]]] = mapped_column(
        MutableList.as_mutable(JSONB),
        default=list,
        nullable=True
    )
    
    # ... остальные поля и relationship
```

## 🔄 Миграция базы данных

После добавления поля `favorite_posts_ids` нужно создать миграцию:

```bash
# Создать миграцию
alembic revision --autogenerate -m "Add favorite_posts_ids to User"

# Применить миграцию
alembic upgrade head
```

Или если используете migrate.py:
```bash
python migrate.py
```

## 📡 WebSocket эндпоинт

Убедитесь, что WebSocket эндпоинт настроен правильно в `chat_views.py`:

```python
from fastapi import WebSocket, WebSocketDisconnect
import json

active_connections = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            # Получаем сообщение от клиента
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Отправляем сообщение получателю
            receiver_id = message_data.get("receiver_id")
            if receiver_id in active_connections:
                await active_connections[receiver_id].send_text(json.dumps({
                    "sender_id": user_id,
                    "content": message_data["content"],
                    "created_at": datetime.utcnow().isoformat()
                }))
    except WebSocketDisconnect:
        if user_id in active_connections:
            del active_connections[user_id]
```

## 🔐 CORS настройка

В главном файле приложения (`main.py`) добавьте CORS:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... остальные роутеры
```

## ✅ Чек-лист перед запуском

- [x] Добавлено поле `favorite_posts_ids` в модель User
- [x] Добавлено поле `chats` в модель User (для активных чатов)
- [x] Создана и применена миграция БД
- [x] Добавлены эндпоинты для избранного:
  - [x] `POST /post/add-favorite-post?post_id={id}`
  - [x] `POST /post/remove-favorite-post?post_id={id}`
  - [x] `GET /post/get-favorite-posts`
- [x] WebSocket эндпоинт работает: `ws://localhost:8000/chat/ws/{user_id}`
- [x] CORS настроен правильно
- [x] Эндпоинты чата работают:
  - [x] `POST /chat/send-message`
  - [x] `GET /chat/history/{user1_id}/{user2_id}/`
  - [x] `PUT /chat/messages/{message_id}/read/`
  - [x] `GET /chat/unread/me/` - непрочитанные сообщения
  - [x] `GET /chat/all-your-chats` - активные чаты
- [x] Существующие эндпоинты работают:
  - [x] `POST /log/token-login`
  - [x] `GET /log/me`
  - [x] `GET /post/get_all_posts`
  - [x] `POST /post/create_post`
  - [x] `DELETE /post/delete-post`
  - [x] `GET /user/get_all_users` (только для админов)
  - [x] `GET /user/get_user_by_username` (для всех)
  - [x] `GET /user/get_user_by_id` (для всех)

## 🧪 Тестирование

### 1. Проверьте запуск бэкенда:
```bash
# Запустите FastAPI
uvicorn main:app --reload

# Проверьте документацию
# Откройте: http://localhost:8000/docs
```

### 2. Проверьте WebSocket:
Вы можете протестировать WebSocket через браузер или инструменты типа Postman.

### 3. Создайте тестового админа:
```python
# В базе данных установите isAdmin = True для пользователя
# Или создайте через SQL:
UPDATE users SET "isAdmin" = true WHERE username = 'admin';
```

## 🆘 Если что-то не работает

### Ошибка "favorite_posts_ids не существует":
```bash
# Пересоздайте миграции
alembic revision --autogenerate -m "Add favorite posts"
alembic upgrade head
```

### Ошибка JSONB:
Убедитесь, что используете PostgreSQL (не SQLite), так как JSONB - это тип PostgreSQL.

Для SQLite используйте:
```python
from sqlalchemy import JSON  # вместо JSONB

favorite_posts_ids: Mapped[Optional[List[int]]] = mapped_column(
    JSON,  # Вместо JSONB
    default=list,
    nullable=True
)
```

### WebSocket не подключается:
1. Проверьте, что путь правильный: `/chat/ws/{user_id}`
2. Убедитесь, что нет конфликтов портов
3. Проверьте firewall

---

После внесения этих изменений ваш бэкенд будет полностью совместим с фронтендом! 🎉
