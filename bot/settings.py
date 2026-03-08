from pydantic_settings import BaseSettings
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12,)

def hash_password(password: str):
    return pwd_context.hash(password)

class Settings(BaseSettings):
    DATABASE_URL: str
    BOT_TOKEN: str
    class Config:
        env_file = '.env'
        case_sensitive = False
        
settings = Settings()