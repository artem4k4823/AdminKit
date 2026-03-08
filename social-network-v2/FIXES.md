# 🐛 Мелкие исправления в бэкенде

## 1️⃣ Исправить имя функции в posts_views.py

В вашем файле `posts_views.py` есть опечатка в имени функции:

```python
# ❌ ТЕКУЩИЙ КОД (с ошибкой):
@router.post('/remove-favorite-post')
async def add_favorite_post(post_id: int, deps: Tuple[User,AsyncSession] = Depends(get_current_user)):
    # ⬆️ функция называется add_favorite_post, но должна быть remove_favorite_post
    user, session = deps
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    if post_id in user.favorite_posts_ids:
        user.favorite_posts_ids.remove(post_id)
        await session.commit()
        return 'post was removed'
    return 'you dont have this post in favorite'
```

```python
# ✅ ИСПРАВЛЕННЫЙ КОД:
@router.post('/remove-favorite-post')
async def remove_favorite_post(post_id: int, deps: Tuple[User,AsyncSession] = Depends(get_current_user)):
    # ⬆️ правильное имя функции
    user, session = deps
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    if post_id in user.favorite_posts_ids:
        user.favorite_posts_ids.remove(post_id)
        await session.commit()
        return {"status": "removed", "post_id": post_id}
    return {"status": "not_found"}
```

## 2️⃣ Улучшение ответов API (опционально)

Для лучшей консистентности рекомендую возвращать JSON объекты вместо строк:

### Было:
```python
return 'post was added'
return 'post was removed'
```

### Лучше:
```python
return {"status": "added", "post_id": post_id}
return {"status": "removed", "post_id": post_id}
```

## 3️⃣ Проверка существования поста (опционально)

Можно добавить проверку, что пост существует перед добавлением в избранное:

```python
@router.post('/add-favorite-post')
async def add_favorite_post(post_id: int, deps: Tuple[User,AsyncSession] = Depends(get_current_user)):
    user, session = deps
    
    # Проверяем существование поста
    post = await session.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пост не найден"
        )
    
    if user.favorite_posts_ids is None:
        user.favorite_posts_ids = []
    
    if post_id not in user.favorite_posts_ids:
        user.favorite_posts_ids.append(post_id)
        await session.commit()
        return {"status": "added", "post_id": post_id}
    
    return {"status": "already_added", "post_id": post_id}
```

## 4️⃣ JSONB мутабельность (если используете PostgreSQL)

Если у вас PostgreSQL и вы используете JSONB, может потребоваться явное обновление:

```python
if post_id not in user.favorite_posts_ids:
    user.favorite_posts_ids.append(post_id)
    # Для JSONB нужно явно переприсвоить список
    user.favorite_posts_ids = user.favorite_posts_ids.copy()
    await session.commit()
```

Но если у вас работает без этого - оставьте как есть!

## 📝 Итого

**Критичное исправление:**
- ✅ Переименовать вторую функцию `add_favorite_post` → `remove_favorite_post`

**Опциональные улучшения:**
- Возвращать JSON вместо строк
- Добавить проверку существования поста
- Явное копирование списка для JSONB (если нужно)

---

**Важно:** Фронтенд уже настроен под ваши текущие эндпоинты:
- `POST /post/add-favorite-post?post_id={id}`
- `POST /post/remove-favorite-post?post_id={id}`
- `GET /post/get-favorite-posts`

Всё должно работать! 🎉
