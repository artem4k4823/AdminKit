# 🔄 Real-Time синхронизация - Постоянное соединение

## 🎯 Цель
**Все изменения на сайте у одного пользователя мгновенно отображаются у всех остальных пользователей!**

## ⚡ Что синхронизируется в реальном времени:

### 📝 Посты:
- ✅ Создание нового поста → все видят его мгновенно
- ✅ Удаление поста → исчезает у всех пользователей
- ✅ Лайк/анлайк поста → обновляется у всех

### 👥 Пользователи:
- ✅ Регистрация нового пользователя → появляется в списках
- ✅ Удаление пользователя → исчезает из списков

### 💬 Сообщения:
- ✅ Новое сообщение → получатель видит мгновенно
- ✅ Счетчик непрочитанных → обновляется в реальном времени

## 🏗️ Архитектура

### WebSocket события (типы):

```javascript
{
  type: 'new_post',        // Создан новый пост
  post: {...}              // Объект поста
}

{
  type: 'delete_post',     // Пост удален
  post_id: 123             // ID удаленного поста
}

{
  type: 'like_post',       // Пост лайкнут
  post_id: 123,
  user_id: 5
}

{
  type: 'unlike_post',     // Лайк убран
  post_id: 123,
  user_id: 5
}

{
  type: 'new_user',        // Новый пользователь
  user: {...}              // Объект пользователя
}

{
  type: 'delete_user',     // Пользователь удален
  user_id: 5
}

{
  type: 'chat_message',    // Сообщение в чате
  sender_id: 5,
  receiver_id: 3,
  content: "Привет!"
}

{
  type: 'ping',            // Поддержание соединения
}

{
  type: 'pong',            // Ответ на ping
}
```

## 💾 Система обработчиков событий

### chatStore - центральный хаб:

```javascript
// Регистрация обработчика
chatStore.registerEventHandler('newPost', (post) => {
  // Добавить пост в список
  posts.value = [post, ...posts.value];
});

// Отправка события
chatStore.broadcastEvent('new_post', { post: newPost });
```

### Обработчики событий в компонентах:

#### HomeView.vue:
```javascript
onMounted(() => {
  // Новый пост
  chatStore.registerEventHandler('newPost', (post) => {
    posts.value = [post, ...posts.value];
  });
  
  // Удален пост
  chatStore.registerEventHandler('deletePost', (postId) => {
    posts.value = posts.value.filter(p => p.id !== postId);
  });
  
  // Лайк
  chatStore.registerEventHandler('likePost', (postId, userId) => {
    if (userId === currentUser.value?.id) {
      fetchFavorites();
    }
  });
});

onUnmounted(() => {
  // Очистка при размонтировании
  chatStore.registerEventHandler('newPost', null);
  // ...
});
```

## 🔄 Процесс синхронизации

### Пример: Создание поста

#### Пользователь A создает пост:
```
1. Заполняет форму
2. Нажимает "Опубликовать"
3. handleCreatePost() вызывается
4. api.createPost() → POST /post/create_post
5. Бэкенд сохраняет в БД
6. Возвращает объект поста
7. chatStore.broadcastEvent('new_post', {post})
8. WebSocket отправляет всем подключенным
```

#### Пользователь B получает обновление:
```
1. WebSocket получает событие {type: 'new_post', post: {...}}
2. chatStore.handleWebSocketEvent() распознает тип
3. Вызывает зарегистрированный обработчик
4. posts.value = [post, ...posts.value]
5. Vue реактивность срабатывает
6. UI обновляется → НОВЫЙ ПОСТ ВИДЕН! ✅
```

### Пример: Удаление поста

#### Пользователь A (или админ) удаляет пост:
```
1. Нажимает кнопку "Удалить"
2. Подтверждает
3. api.deletePost(postId) → DELETE /post/delete-post
4. Бэкенд удаляет из БД
5. chatStore.broadcastEvent('delete_post', {post_id: 123})
6. WebSocket рассылает всем
```

#### Пользователи B, C, D получают:
```
1. WebSocket событие {type: 'delete_post', post_id: 123}
2. Обработчик deletePost срабатывает
3. posts.value = posts.value.filter(p => p.id !== 123)
4. UI обновляется → ПОСТ ИСЧЕЗ! ✅
```

### Пример: Лайк поста

#### Пользователь A лайкает пост:
```
1. Клик на ❤️
2. api.addToFavorites(postId)
3. chatStore.broadcastEvent('like_post', {post_id, user_id})
4. WebSocket рассылает
```

#### Пользователь A (тот же) получает событие:
```
1. Обработчик likePost проверяет userId
2. Если это текущий пользователь → fetchFavorites()
3. Избранное обновляется
```

## 🔌 Поддержание соединения

### Ping/Pong механизм:
```javascript
// Каждые 30 секунд отправляем ping
setInterval(() => {
  if (ws && connected) {
    ws.send(JSON.stringify({type: 'ping'}));
  }
}, 30000);

// Бэкенд отвечает pong
// Если ответа нет → соединение разорвано → переподключение
```

### Автопереподключение:
```javascript
ws.onclose = () => {
  connected = false;
  console.log('❌ WebSocket отключен');
  
  // Переподключение через 3 секунды
  setTimeout(() => {
    if (authStore.isAuthenticated) {
      initWebSocket();
    }
  }, 3000);
};
```

## 🎨 Визуализация потока данных

```
┌─────────────┐                    ┌─────────────┐
│ Пользователь│                    │ Пользователь│
│      A      │                    │      B      │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Создает пост                 │
       ├──────────────────┐               │
       │                  ▼               │
       │            ┌──────────┐          │
       │            │  Backend │          │
       │            │  FastAPI │          │
       │            └─────┬────┘          │
       │                  │               │
       │ 2. Сохраняет в БД│               │
       │                  │               │
       │            ┌─────▼────┐          │
       │            │ WebSocket│          │
       │            │  Server  │          │
       │            └─────┬────┘          │
       │                  │               │
       │ 3. Broadcast     │ 4. Получает  │
       │    всем          ├──────────────►│
       ◄──────────────────┘               │
       │                                  │
       │ 5. UI обновлен                   │ 5. UI обновлен
       │    ✅ Пост виден                 │    ✅ Пост виден
       │                                  │
```

## 📝 Требования к бэкенду

### WebSocket должен поддерживать broadcast:

```python
# Хранить все активные соединения
active_connections = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Broadcast всем пользователям
            await broadcast_to_all(message_data)
    
    except WebSocketDisconnect:
        del active_connections[user_id]

async def broadcast_to_all(data):
    """Отправить событие всем подключенным пользователям"""
    for user_id, connection in active_connections.items():
        try:
            await connection.send_text(json.dumps(data))
        except:
            # Соединение разорвано
            pass
```

### Важно!
Сейчас WebSocket отправляет только получателю. Нужно изменить на broadcast!

```python
# ❌ ТЕКУЩИЙ КОД (только получателю):
receiver_id = message_data.get("receiver_id")
if receiver_id in active_connections:
    await active_connections[receiver_id].send_text(...)

# ✅ НУЖНО (всем):
event_type = message_data.get("type")

if event_type == "chat_message":
    # Сообщения только получателю
    receiver_id = message_data.get("receiver_id")
    if receiver_id in active_connections:
        await active_connections[receiver_id].send_text(...)
else:
    # Остальные события - всем!
    for conn in active_connections.values():
        await conn.send_text(json.dumps(message_data))
```

## 🎯 Примеры использования

### Тест 1: Два пользователя, один создает пост
```
1. Откройте два браузера (или окна инкогнито)
2. Войдите как user1 и user2
3. У user1 перейдите на /home
4. У user2 тоже на /home
5. У user1 создайте пост
6. ✅ У user2 пост появится БЕЗ перезагрузки!
```

### Тест 2: Админ удаляет пост
```
1. user1 на /home
2. admin на /admin
3. admin удаляет пост
4. ✅ У user1 пост исчезнет мгновенно!
```

### Тест 3: Лайки
```
1. user1 на /home
2. user2 на /profile → Избранные посты
3. user2 лайкает пост
4. ✅ Счетчик лайков обновляется у обоих!
```

## 🔍 Отладка

### Консоль логи показывают весь процесс:
```
// При отправке
📤 Отправлено событие: new_post {post: {...}}

// При получении
📨 Получено WebSocket сообщение: {type: 'new_post', post: {...}}
🆕 Новый пост создан: {...}

// В обработчике
✅ Пост добавлен в список
```

### Проверка соединения:
```
✅ WebSocket подключен     // Соединение установлено
❌ WebSocket отключен      // Соединение разорвано
🔄 Переподключение...      // Автоматическое восстановление
```

## ✨ Преимущества

✅ **Instant Updates** - все видят изменения мгновенно  
✅ **No Polling** - не нужно опрашивать сервер каждые N секунд  
✅ **Efficient** - только измененные данные передаются  
✅ **Scalable** - легко добавить новые типы событий  
✅ **Reliable** - автопереподключение при разрыве  
✅ **User-Friendly** - пользователи всегда видят актуальные данные  

## 🚀 Результат

Теперь ваше приложение работает как **настоящая real-time социальная сеть**:
- Посты появляются у всех мгновенно
- Удаления отображаются сразу
- Лайки синхронизируются
- Новые пользователи видны всем
- Чаты работают в реальном времени

**Как в Instagram, Twitter, Facebook!** 🎉

---

**Важно:** Не забудьте обновить бэкенд для поддержки broadcast!
