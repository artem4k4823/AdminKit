# 🔧 Обновление WebSocket для Real-Time синхронизации

## ⚠️ Критически важно!

Для работы real-time синхронизации нужно обновить `chat_views.py` на бэкенде.

## 📝 Текущая проблема

Сейчас WebSocket отправляет сообщения только конкретному получателю:

```python
# ❌ Работает только для чатов
receiver_id = message_data.get("receiver_id")
if receiver_id in active_connections:
    await active_connections[receiver_id].send_text(...)
```

## ✅ Решение: Broadcast для разных типов событий

Замените файл `chat_views.py` на этот код:

```python
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select, and_, or_
import json
from app.schemas.message import MessageCreate
from app.core.database import db
from app.core.models.users import User, Message
from app.crud.auth import get_current_user
from typing import Tuple, Annotated
from app.crud.user import get_user_by_id


router = APIRouter(prefix='/chat', tags=['Chat'])

# Храним все активные WebSocket соединения
active_connections = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            # Получаем данные от клиента
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Определяем тип события
            event_type = message_data.get("type", "message")
            
            # Обрабатываем разные типы событий
            if event_type in ["message", "chat_message"]:
                # Сообщения чата - только получателю
                receiver_id = message_data.get("receiver_id")
                if receiver_id in active_connections:
                    await active_connections[receiver_id].send_text(json.dumps({
                        "type": "chat_message",
                        "sender_id": user_id,
                        "content": message_data["content"]
                    }))
            
            elif event_type == "ping":
                # Ответ на ping
                await websocket.send_text(json.dumps({"type": "pong"}))
            
            else:
                # Все остальные события - broadcast всем пользователям
                await broadcast_to_all(message_data, exclude_user=user_id)
    
    except WebSocketDisconnect:
        # Удаляем соединение при отключении
        if user_id in active_connections:
            del active_connections[user_id]
        print(f"User {user_id} disconnected")


async def broadcast_to_all(data: dict, exclude_user: int = None):
    """
    Отправить событие всем подключенным пользователям
    
    Args:
        data: Данные для отправки
        exclude_user: ID пользователя, которого нужно исключить (отправителя)
    """
    disconnected = []
    
    for user_id, connection in active_connections.items():
        # Не отправляем отправителю (он сам обновит UI)
        if user_id == exclude_user:
            continue
        
        try:
            await connection.send_text(json.dumps(data))
            print(f"✅ Sent to user {user_id}: {data.get('type')}")
        except:
            # Соединение разорвано
            disconnected.append(user_id)
            print(f"❌ Failed to send to user {user_id}")
    
    # Удаляем разорванные соединения
    for user_id in disconnected:
        if user_id in active_connections:
            del active_connections[user_id]


# Остальные эндпоинты остаются без изменений

@router.post('/send-message')
async def send_message(message: MessageCreate, deps: Tuple[User, AsyncSession] = Depends(get_current_user)):
    user, session = deps
    receiver = await get_user_by_id(session=session, user_id=message.receiver_id)
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    
    db_message = Message(
        sender_id=user.id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    session.add(db_message)
    await session.commit()
    await session.refresh(db_message)
    
    return db_message


@router.get("/history/{user1_id}/{user2_id}/")
async def get_chat_history(
    user1_id: int,
    user2_id: int,
    session: Annotated[AsyncSession, Depends(db.session_getter)]
):
    result = await session.execute(
        select(Message)
        .where(
            or_(
                and_(
                    Message.sender_id == user1_id,
                    Message.receiver_id == user2_id
                ),
                and_(
                    Message.sender_id == user2_id,
                    Message.receiver_id == user1_id
                )
            )
        )
        .order_by(Message.created_at)
    )
    
    messages = result.scalars().all()
    return messages


@router.put("/messages/{message_id}/read/")
async def mark_as_read(message_id: int, session: Annotated[AsyncSession, Depends(db.session_getter)]):
    result = await session.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = 1
    await session.commit()
    
    return {"status": "message marked as read"}


@router.get("/unread/{user_id}/")
async def get_some_unread_messages(deps: Tuple[User, AsyncSession] = Depends(get_current_user)):
    user, session = deps
    stmt = select(Message).where(and_(Message.receiver_id == user.id, Message.is_read == 0))
    result = await session.execute(stmt)
    unread_messages = result.scalars().all()
    return unread_messages


@router.get('/all-your-chats')
async def get_all_my_chats(deps: Tuple[User, AsyncSession] = Depends(get_current_user)):
    user, session = deps
    stmt = select(Message).where(or_(Message.sender_id == user.id, Message.receiver_id == user.id)).order_by(Message.created_at.desc())
    result = await session.execute(stmt)
    messages = result.scalars().all()
    
    if not user.chats:
        user.chats = []
    
    for message in messages:
        if message.sender_id == user.id:
            chat_partner_id = message.receiver_id
        else:
            chat_partner_id = message.sender_id
        
        if chat_partner_id not in user.chats:
            user.chats.append(chat_partner_id)
            await session.commit()
    
    return user.chats
```

## 🔑 Ключевые изменения

### 1. Определение типа события
```python
event_type = message_data.get("type", "message")
```

### 2. Разная обработка для разных типов
```python
if event_type in ["message", "chat_message"]:
    # Только получателю
    await send_to_receiver(...)
elif event_type == "ping":
    # Ответ на ping
    await websocket.send_text({"type": "pong"})
else:
    # Broadcast всем (посты, лайки, пользователи)
    await broadcast_to_all(message_data)
```

### 3. Функция broadcast_to_all
```python
async def broadcast_to_all(data: dict, exclude_user: int = None):
    for user_id, connection in active_connections.items():
        if user_id == exclude_user:
            continue  # Не отправляем отправителю
        
        await connection.send_text(json.dumps(data))
```

## 📋 Типы событий которые нужно broadcast'ить

| Тип события | Когда отправляется | Кто должен получить |
|-------------|-------------------|---------------------|
| `new_post` | Создан новый пост | Все пользователи |
| `delete_post` | Пост удален | Все пользователи |
| `like_post` | Пост лайкнут | Все пользователи |
| `unlike_post` | Лайк убран | Все пользователи |
| `new_user` | Новая регистрация | Все пользователи |
| `delete_user` | Пользователь удален | Все пользователи |
| `chat_message` | Сообщение в чате | **Только получатель** |
| `ping` | Проверка соединения | **Только отправитель** |

## 🧪 Тестирование

### 1. Проверьте что WebSocket работает:
```bash
# Запустите бэкенд
uvicorn main:app --reload

# В логах должно быть:
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Откройте два браузера:
```
Браузер 1: user1 на /home
Браузер 2: user2 на /home
```

### 3. Создайте пост в Браузере 1:
```
✅ Пост должен появиться в Браузере 2 БЕЗ перезагрузки!
```

### 4. Проверьте логи бэкенда:
```
✅ Sent to user 2: new_post
✅ Sent to user 3: new_post
...
```

## 🐛 Решение проблем

### Проблема: События не доходят
```python
# Проверьте что broadcast_to_all вызывается
print(f"📢 Broadcasting {data.get('type')} to all users")
```

### Проблема: Соединения разрываются
```python
# Добавьте обработку исключений
try:
    await connection.send_text(json.dumps(data))
except Exception as e:
    print(f"Error sending to {user_id}: {e}")
```

### Проблема: Дублирование событий
```python
# Используйте exclude_user чтобы не отправлять отправителю
await broadcast_to_all(message_data, exclude_user=user_id)
```

## ✅ Чек-лист

- [ ] Скопировал новый код в `chat_views.py`
- [ ] Перезапустил бэкенд
- [ ] Открыл два браузера
- [ ] Протестировал создание поста
- [ ] Протестировал удаление поста
- [ ] Протестировал лайки
- [ ] Протестировал чат (должен работать как раньше)
- [ ] Проверил логи - нет ошибок

## 🎉 Результат

После обновления:
- ✅ Все пользователи видят изменения мгновенно
- ✅ Чаты работают как раньше (только получателю)
- ✅ Посты синхронизируются
- ✅ Лайки обновляются у всех
- ✅ Новые пользователи появляются в списках

**Приложение работает в real-time! 🚀**

---

**Важно:** Обязательно протестируйте после обновления!
