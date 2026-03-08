import asyncio
import asyncpg
import json
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import logging
from settings import settings
from settings import hash_password

# Включить логирование
logging.basicConfig(level=logging.INFO)

# НАСТРОЙКИ
DB_URL = settings.DATABASE_URL
BOT_TOKEN = settings.BOT_TOKEN

# Создаем бота и диспетчер
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    await message.answer(
        "Привет! Я бот для регистрации пользователей.\n\n"
        "Для регистрации отправьте данные в формате:\n"
        "<code>/register username password</code>\n\n"
        "Можно добавить параметры:\n"
        "<code>/register username password --admin</code> - сделать админом\n"
        "<code>/register username password --disabled</code> - отключить аккаунт",
        parse_mode="HTML"
    )

@dp.message(Command("register"))
async def register_user(message: types.Message):
    """Регистрация пользователя с шифрованием пароля"""
    # Проверяем формат сообщения
    if len(message.text.split()) < 3:
        await message.answer(
            "❌ Неправильный формат!\n"
            "Используйте: <code>/register username password</code>\n\n"
            "Можно добавить параметры:\n"
            "<code>/register username password --admin</code> - сделать админом\n"
            "<code>/register username password --disabled</code> - отключить аккаунт",
            parse_mode="HTML"
        )
        return
    
    try:
        # Разбиваем сообщение
        parts = message.text.split()
        command = parts[0]
        username = parts[1]
        password = parts[2]
        
        # Определяем флаги
        is_admin = "--admin" in parts
        is_disabled = "--disabled" in parts
        
        # Базовые значения
        status = not is_disabled  # True если не отключен
        is_admin_flag = is_admin
        
        # ХЕШИРУЕМ ПАРОЛЬ перед сохранением
        hashed_password = hash_password(password)
        
        # Подключаемся к БД
        conn = await asyncpg.connect(DB_URL)
        
        # Сохраняем в БД с ВСЕМИ полями из модели User
        await conn.execute(
            """
            INSERT INTO users (
                username, 
                password, 
                status, 
                "isAdmin",
                favorite_posts_ids
            ) VALUES ($1, $2, $3, $4, $5)
            """,
            username, 
            hashed_password,  # Используем хешированный пароль
            status, 
            is_admin_flag,
            json.dumps([])  # Пустой массив для favorite_posts_ids
        )
        
        # Получаем созданного пользователя
        user = await conn.fetchrow(
            """
            SELECT id, username, status, "isAdmin"
            FROM users 
            WHERE username = $1
            """,
            username
        )
        
        await conn.close()
        
        # Отправляем подтверждение
        await message.answer(
            f"✅ Пользователь успешно зарегистрирован!\n\n"
            f"<b>ID:</b> {user['id']}\n"
            f"<b>Username:</b> {user['username']}\n"
            f"<b>Password:</b> (хешированный) {hashed_password[:15]}...\n"
            f"<b>Status:</b> {'✅ Active' if user['status'] else '❌ Disabled'}\n"
            f"<b>Admin:</b> {'👑 Yes' if user['isAdmin'] else '👤 No'}\n"
            f"<b>Favorite Posts:</b> []\n",
            parse_mode="HTML"
        )
        
    except asyncpg.UniqueViolationError:
        await message.answer("❌ Такой username уже существует!")
    except Exception as e:
        logging.error(f"Error: {e}")
        await message.answer(f"❌ Ошибка: {str(e)[:100]}")

@dp.message()
async def handle_other_messages(message: types.Message):
    """Обработка любых других сообщений"""
    await message.answer(
        "Используйте команды:\n"
        "/start - Информация о боте\n"
        "/register username password - Регистрация пользователя\n\n"
        "Пример: /register myuser mypassword123"
    )

async def main():
    print("🔄 Запуск бота...")
    try:
        # Проверяем подключение к боту
        me = await bot.get_me()
        print(f"✅ Бот запущен: @{me.username}")
        print(f"🆔 ID бота: {me.id}")
        print("\n📋 Доступные команды:")
        print("/start - Начать работу")
        print("/register username password - Регистрация пользователя")
        print("  Добавьте --admin для админа, --disabled для отключения")
        
        # Запускаем polling
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")

if __name__ == "__main__":
    asyncio.run(main())