# 🔧 Дополнение бэкенда для полной работы фронтенда

## ⚠️ Важно!

Для полноценной работы фронтенда необходимо добавить несколько эндпоинтов в ваш FastAPI бэкенд.

## 📝 Недостающие эндпоинты для избранного

Создайте или дополните файл `posts_views.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Tuple
from app.core.models import User, Post
from app.crud.auth import get_current_user

router = APIRouter(prefix='/post', tags=['posts'])

# ==================== ИЗБРАННЫЕ ПОСТЫ ====================

@router.post('/add-to-favorites')
async def add_to_favorites(
    post_id: int,
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    """Добавить пост в избранное"""
    user, session = deps
    
    # Проверяем существование поста
    post = await session.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пост не найден"
        )
    
    # Инициализируем список если его нет
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    
    # Добавляем если еще не добавлен
    if post_id not in user.favorite_posts_ids:
        user.favorite_posts_ids.append(post_id)
        # Важно! Для JSONB нужно явно присвоить список
        user.favorite_posts_ids = user.favorite_posts_ids.copy()
        await session.commit()
    
    return {"status": "added", "post_id": post_id}


@router.delete('/remove-from-favorites')
async def remove_from_favorites(
    post_id: int,
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    """Убрать пост из избранного"""
    user, session = deps
    
    if user.favorite_posts_ids and post_id in user.favorite_posts_ids:
        user.favorite_posts_ids.remove(post_id)
        # Важно! Для JSONB нужно явно присвоить список
        user.favorite_posts_ids = user.favorite_posts_ids.copy()
        await session.commit()
    
    return {"status": "removed", "post_id": post_id}


@router.get('/get-favorite-posts')
async def get_favorite_posts(
    deps: Tuple[User, AsyncSession] = Depends(get_current_user)
):
    """Получить все избранные посты пользователя"""
    user, session = deps
    
    if not user.favorite_posts_ids:
        return []
    
    # Получаем посты по ID
    result = await session.execute(
        select(Post).where(Post.id.in_(user.favorite_posts_ids))
    )
    posts = result.scalars().all()
    
    return posts
```

## 🗄️ Обновление модели User

Убедитесь, что в вашей модели `User` (файл `users.py`) есть поле `favorite_posts_ids`:

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
    
    # ВАЖНО! Это поле для избранных постов
    favorite_posts_ids: Mapped[Optional[List[int]]] = mapped_column(
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

- [ ] Добавлено поле `favorite_posts_ids` в модель User
- [ ] Создана и применена миграция БД
- [ ] Добавлены эндпоинты для избранного:
  - [ ] `POST /post/add-to-favorites`
  - [ ] `DELETE /post/remove-from-favorites`
  - [ ] `GET /post/get-favorite-posts`
- [ ] WebSocket эндпоинт работает: `ws://localhost:8000/chat/ws/{user_id}`
- [ ] CORS настроен правильно
- [ ] Эндпоинты чата работают:
  - [ ] `POST /chat/send-message`
  - [ ] `GET /chat/history/{user1_id}/{user2_id}/`
- [ ] Существующие эндпоинты работают:
  - [ ] `POST /log/token-login`
  - [ ] `GET /log/me`
  - [ ] `GET /post/get_all_posts`
  - [ ] `POST /post/create_post`
  - [ ] `DELETE /post/delete-post`
  - [ ] `GET /user/get_all_users`

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
