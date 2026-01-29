# migrate.py (разместите в корне проекта, рядом с app папкой)
import asyncio
import sys
import os

# Добавляем путь к проекту в sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Теперь импорты будут работать
from app.core.base import Base
from app.models.users import User

# Настройки базы данных
DATABASE_URL = "postgresql+asyncpg://username:password@localhost:5433/shop"

async def migrate():
    """Создает все таблицы из ваших моделей"""
    print("🔨 Создаю таблицы в базе данных...")
    
    # Создаем движок
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        # Создаем все таблицы
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Все таблицы успешно созданы!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())