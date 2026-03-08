# 🚀 Быстрый старт - WebSocket исправлен!

## ✅ Проблема решена!

**Было:** `ws://localhost:5173/ws/chat/ws/13` ❌  
**Стало:** `ws://localhost:8000/chat/ws/13` ✅

## 📝 Что нужно сделать:

### 1. Запустите бэкенд (FastAPI):
```bash
cd путь/к/бэкенду
uvicorn main:app --reload
```

**Проверка:** Откройте http://localhost:8000/docs  
Должен быть WebSocket эндпоинт: `/chat/ws/{user_id}`

### 2. Запустите фронтенд:
```bash
cd social-network-v2
npm install
npm run dev
```

**Откройте:** http://localhost:5173

### 3. Проверьте WebSocket:

1. Откройте консоль (F12)
2. Войдите в систему
3. **Должны увидеть:**
```
✅ Вход выполнен, инициализируем WebSocket...
🔌 Создаем WebSocket соединение: ws://localhost:8000/chat/ws/1
🔌 Подключение WebSocket для пользователя: 1
✅ WebSocket подключен успешно!
✅ WebSocket инициализирован
```

### 4. Создайте пост:

1. Перейдите на /home
2. Создайте пост
3. **В консоли должно быть:**
```
📝 Создаем пост...
✅ Пост создан через API: {...}
🔍 Проверяем WebSocket. Подключен: true
📤 Событие отправлено: new_post
```

## ✅ Всё работает!

**WebSocket теперь:**
- ✅ Подключается к правильному хосту (localhost:8000)
- ✅ Автоматически инициализируется при входе
- ✅ Переподключается при разрыве соединения
- ✅ Отправляет события через WebSocket

## 🔍 Если есть проблемы:

### Ошибка подключения WebSocket:
```
❌ WebSocket connection to 'ws://localhost:8000/chat/ws/1' failed
```

**Причина:** Бэкенд не запущен или WebSocket эндпоинт не работает

**Решение:**
1. Запустите бэкенд
2. Проверьте что `/chat/ws/{user_id}` есть в docs
3. Проверьте что порт 8000 свободен

### Ошибка CORS:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Решение:** В `main.py` бэкенда добавьте:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Консоль - что должно быть:

### ✅ Успешное подключение:
```
🔌 Создаем WebSocket соединение: ws://localhost:8000/chat/ws/1
✅ WebSocket подключен успешно!
📡 Ping отправлен (каждые 30 сек)
📡 Pong получен
```

### ❌ Ошибка:
```
❌ WebSocket connection failed
❌ WebSocket ошибка: Event {...}
```
→ Проверьте бэкенд!

---

## 🎯 Следующий шаг: Real-Time синхронизация

Для работы синхронизации между пользователями нужно обновить бэкенд.

**См. файл:** `BACKEND_WEBSOCKET_UPDATE.md`

**Кратко:**
- Сейчас: События отправляются, но только себе
- После обновления: События видят ВСЕ пользователи в реальном времени!

---

**Всё готово к работе!** 🎉
